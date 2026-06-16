import { describe, it, expect } from 'vitest'
import { getAbilitySlots } from '../fullAutoSkills'
import type { Character, CharacterSkill, CharacterSkillVersion } from '$lib/types/api/entities'

function version(
	name: string,
	opts: Partial<CharacterSkillVersion> & { target?: string } = {}
): CharacterSkillVersion {
	const { target, ...rest } = opts
	return {
		id: name,
		name: { en: name, ja: name },
		description: { en: '', ja: '' },
		variantRole: 'base',
		ordinal: 1,
		skillEffects: target ? [{ id: 't', ordinal: 0, effectType: 'grant_status', target }] : [],
		...rest
	} as CharacterSkillVersion
}

function slot(kind: string, position: number, base: CharacterSkillVersion): CharacterSkill {
	return { kind, position, versions: [base] }
}

// Modeled on Rei (3040265000): slot 1 one_ally buff (ineligible), slot 2 caster
// buff (eligible), slot 3 all_foes debuff (eligible), slot 4 buff no-target
// (eligible); plus a heal slot and an ougi that must be excluded/ineligible.
function rei(): Character {
	return {
		skills: [
			slot('ability', 1, version('Alaya-Vijnana', { typeColor: 'buff', target: 'one_ally' })),
			slot('ability', 2, version('Moksha', { typeColor: 'buff', target: 'caster' })),
			slot('ability', 3, version('Cold Stare', { typeColor: 'debuff', target: 'all_foes' })),
			slot('ability', 4, version('Ama no Sakate', { typeColor: 'buff' })),
			slot('ougi', 1, version('Some Ougi', { typeColor: 'damage' }))
		]
	} as Character
}

describe('getAbilitySlots', () => {
	it('returns ability slots in order, excluding ougi/support', () => {
		const slots = getAbilitySlots(rei())
		expect(slots.map((s) => s.slot)).toEqual([1, 2, 3, 4])
		expect(slots.map((s) => s.name)).toEqual([
			'Alaya-Vijnana',
			'Moksha',
			'Cold Stare',
			'Ama no Sakate'
		])
	})

	it('marks one_ally-target skills ineligible but keeps other targets eligible', () => {
		const byName = Object.fromEntries(getAbilitySlots(rei()).map((s) => [s.name, s.eligible]))
		expect(byName['Alaya-Vijnana']).toBe(false) // one_ally
		expect(byName['Moksha']).toBe(true) // caster
		expect(byName['Cold Stare']).toBe(true) // all_foes
		expect(byName['Ama no Sakate']).toBe(true) // no target
	})

	it('marks heal and field skills ineligible', () => {
		const character = {
			skills: [
				slot('ability', 1, version('Heal Skill', { typeColor: 'heal' })),
				slot('ability', 2, version('Field Skill', { typeColor: 'field' }))
			]
		} as Character
		expect(getAbilitySlots(character).every((s) => !s.eligible)).toBe(true)
	})

	it('returns an empty array for a character with no skills', () => {
		expect(getAbilitySlots({} as Character)).toEqual([])
		expect(getAbilitySlots(undefined)).toEqual([])
	})
})
