import { describe, it, expect } from 'vitest'
import { transformSkillsToArray, updateSkillInSlot } from '../jobSkills'
import type { JobSkill } from '$lib/types/api/entities'
import type { JobSkillsMap } from '../jobSkills'

function makeSkill(id: string): JobSkill {
	return {
		id,
		name: { en: `Skill ${id}`, ja: `スキル${id}` },
		main: false,
		sub: false,
		emp: false,
		base: false
	} as JobSkill
}

// ============================================================================
// transformSkillsToArray
// ============================================================================

describe('transformSkillsToArray', () => {
	it('converts skills map to array with slot numbers', () => {
		const map: JobSkillsMap = {
			'0': makeSkill('s-1'),
			'1': makeSkill('s-2')
		}
		const result = transformSkillsToArray(map)
		expect(result).toEqual([
			{ id: 's-1', slot: 0 },
			{ id: 's-2', slot: 1 }
		])
	})

	it('filters out null values', () => {
		const map: JobSkillsMap = {
			'0': makeSkill('s-1'),
			'1': null,
			'2': makeSkill('s-3')
		}
		const result = transformSkillsToArray(map)
		expect(result).toHaveLength(2)
		expect(result.map((r) => r.id)).toEqual(['s-1', 's-3'])
	})

	it('filters out undefined values', () => {
		const map: JobSkillsMap = {
			'0': makeSkill('s-1'),
			'1': undefined
		}
		const result = transformSkillsToArray(map)
		expect(result).toHaveLength(1)
	})

	it('returns empty array for empty map', () => {
		expect(transformSkillsToArray({})).toEqual([])
	})
})

// ============================================================================
// updateSkillInSlot
// ============================================================================

describe('updateSkillInSlot', () => {
	it('sets a skill in the specified slot', () => {
		const current: JobSkillsMap = { '0': makeSkill('s-1') }
		const result = updateSkillInSlot(current, 1, makeSkill('s-2'))
		expect(result['1']!.id).toBe('s-2')
	})

	it('removes a skill when null is passed', () => {
		const current: JobSkillsMap = { '0': makeSkill('s-1'), '1': makeSkill('s-2') }
		const result = updateSkillInSlot(current, 1, null)
		expect(result['1']).toBeUndefined()
		expect('1' in result).toBe(false)
	})

	it('returns a new object (immutable)', () => {
		const current: JobSkillsMap = { '0': makeSkill('s-1') }
		const result = updateSkillInSlot(current, 1, makeSkill('s-2'))
		expect(result).not.toBe(current)
		expect(current['1']).toBeUndefined()
	})

	it('preserves existing slots', () => {
		const current: JobSkillsMap = { '0': makeSkill('s-1'), '2': makeSkill('s-3') }
		const result = updateSkillInSlot(current, 1, makeSkill('s-2'))
		expect(result['0']!.id).toBe('s-1')
		expect(result['2']!.id).toBe('s-3')
	})
})
