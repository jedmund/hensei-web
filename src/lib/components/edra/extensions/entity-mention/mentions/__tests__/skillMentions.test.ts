import { describe, it, expect } from 'vitest'
import type { Character, CharacterSkill, CharacterSkillVersion } from '$lib/types/api/entities'
import type { GridCharacter } from '$lib/types/api/party'
import { buildPartySkillMentions, matchSkills } from '../skillMentions'

function version(nameEn: string, opts: Partial<CharacterSkillVersion> = {}): CharacterSkillVersion {
	return {
		id: nameEn,
		name: { en: nameEn, ja: nameEn },
		description: { en: '', ja: '' },
		variantRole: 'base',
		ordinal: 1,
		...opts
	} as CharacterSkillVersion
}

function slot(kind: string, position: number, versions: CharacterSkillVersion[]): CharacterSkill {
	return { kind, position, versions }
}

function gridChar(granblueId: string, nameEn: string, skills: CharacterSkill[]): GridCharacter {
	return {
		character: {
			granblueId,
			name: { en: nameEn, ja: nameEn },
			skills
		} as Character
	} as GridCharacter
}

describe('buildPartySkillMentions', () => {
	it('returns an empty list for an empty party or characters without skills', () => {
		expect(buildPartySkillMentions([])).toEqual([])
		expect(buildPartySkillMentions([gridChar('1', 'Lyria', [])])).toEqual([])
	})

	it('picks the base version, else the lowest-ordinal version, per slot', () => {
		const character = gridChar('1', 'Percival', [
			slot('ability', 1, [
				version('Enhanced', { variantRole: 'enhanced', ordinal: 2 }),
				version('Base Skill', { variantRole: 'base', ordinal: 1 })
			]),
			slot('ability', 2, [
				version('Second', { variantRole: 'enhanced', ordinal: 3 }),
				version('First', { variantRole: 'enhanced', ordinal: 1 })
			])
		])
		const names = buildPartySkillMentions([character]).map((s) => s.token.name.en)
		expect(names).toEqual(['Base Skill', 'First'])
	})

	it('orders slots active → CA → support, then by position, regardless of input order', () => {
		const character = gridChar('1', 'Percival', [
			slot('support', 1, [version('Support')]),
			slot('ougi', 1, [version('Ougi')]),
			slot('ability', 2, [version('Ability 2')]),
			slot('ability', 1, [version('Ability 1')])
		])
		expect(buildPartySkillMentions([character]).map((s) => s.token.name.en)).toEqual([
			'Ability 1',
			'Ability 2',
			'Ougi',
			'Support'
		])
	})

	it('records the slot kind and position on each skill token', () => {
		const character = gridChar('1', 'Percival', [slot('ability', 3, [version('Third')])])
		const suggestions = buildPartySkillMentions([character])
		expect(suggestions).toHaveLength(1)
		expect(suggestions[0]?.token.skill?.slotKind).toBe('ability')
		expect(suggestions[0]?.token.skill?.slotPosition).toBe(3)
	})

	it('dedupes same-named skills within one character', () => {
		const character = gridChar('1', 'Percival', [
			slot('ability', 1, [version('Twin Skill')]),
			slot('ability', 2, [version('Twin Skill')])
		])
		expect(buildPartySkillMentions([character])).toHaveLength(1)
	})

	it('keeps same-named skills on different characters as separate rows', () => {
		const a = gridChar('1', 'Percival', [slot('ability', 1, [version('Shared')])])
		const b = gridChar('2', 'Lancelot', [slot('ability', 1, [version('Shared')])])
		const result = buildPartySkillMentions([a, b])
		expect(result).toHaveLength(2)
		expect(result.map((s) => s.token.skill?.character?.granblue_id)).toEqual(['1', '2'])
	})
})

describe('matchSkills', () => {
	const party = [
		gridChar('1', 'Percival', [slot('ability', 1, [version('Lord of Flames')])]),
		gridChar('2', 'Lancelot', [slot('ability', 1, [version('White Dragon')])])
	]
	const suggestions = buildPartySkillMentions(party)

	it('matches by skill name (EN, case-insensitive substring)', () => {
		expect(matchSkills(suggestions, 'flam').map((s) => s.token.name.en)).toEqual(['Lord of Flames'])
	})

	it('matches by owning character name', () => {
		expect(matchSkills(suggestions, 'lancel').map((s) => s.token.name.en)).toEqual(['White Dragon'])
	})

	it('matches by Japanese name', () => {
		const jp = buildPartySkillMentions([
			gridChar('1', 'Percival', [
				slot('ability', 1, [
					{
						id: 'x',
						name: { en: 'Lord of Flames', ja: '焔の貴公子' },
						description: { en: '', ja: '' },
						variantRole: 'base',
						ordinal: 1
					} as CharacterSkillVersion
				])
			])
		])
		expect(matchSkills(jp, '焔').map((s) => s.token.name.en)).toEqual(['Lord of Flames'])
	})

	it('returns nothing for an empty query', () => {
		expect(matchSkills(suggestions, '   ')).toEqual([])
	})

	it('returns every match (no per-skill cap) so all of a character’s skills stay visible', () => {
		const many = buildPartySkillMentions([
			gridChar(
				'1',
				'Percival',
				Array.from({ length: 10 }, (_, i) => slot('ability', i + 1, [version(`Flame Skill ${i}`)]))
			)
		])
		expect(matchSkills(many, 'flame').length).toBe(10)
	})
})
