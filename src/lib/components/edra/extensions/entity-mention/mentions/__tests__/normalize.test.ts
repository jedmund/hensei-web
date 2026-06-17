import { describe, it, expect } from 'vitest'
import { getBasePath } from '$lib/utils/images'
import type { UnifiedSearchResult } from '$lib/api/adapters/search.adapter'
import type { CharacterSkillVersion } from '$lib/types/api/entities'
import { entityResultToSuggestion, skillToSuggestion } from '../normalize'

const base = getBasePath()

describe('entityResultToSuggestion', () => {
	it('maps a character search result into a suggestion (parity with the old selectItem)', () => {
		const result: UnifiedSearchResult = {
			searchableId: 'abc-123',
			searchableType: 'Character',
			granblueId: '3040001000',
			nameEn: 'Percival',
			nameJp: 'パーシヴァル',
			element: 2,
			season: null,
			series: [{ id: 's1', slug: 'standard', name: { en: 'Standard', ja: '' } }],
			proficiency: [1, 2],
			styleSwap: false
		}
		const suggestion = entityResultToSuggestion(result)
		expect(suggestion.key).toBe('character:abc-123')
		expect(suggestion.token.type).toBe('character')
		expect(suggestion.token.granblue_id).toBe('3040001000')
		expect(suggestion.token.element).toEqual({ id: 2, slug: 'fire' })
		expect(suggestion.token.proficiency).toEqual([1, 2])
		expect(suggestion.imageUrl).toBe(`${base}/characters/square/3040001000_01.jpg`)
		expect(suggestion.primaryLabel).toBe('Percival')
		expect(suggestion.elementSlug).toBe('fire')
	})

	it('maps a weapon result to its square image and weapon type', () => {
		const result: UnifiedSearchResult = {
			searchableId: 'w-1',
			searchableType: 'Weapon',
			granblueId: '1040001000',
			nameEn: 'Sword',
			element: 3,
			proficiency: 1
		}
		const suggestion = entityResultToSuggestion(result)
		expect(suggestion.token.type).toBe('weapon')
		expect(suggestion.imageUrl).toBe(`${base}/weapons/square/1040001000.jpg`)
	})
})

function version(overrides: Partial<CharacterSkillVersion> = {}): CharacterSkillVersion {
	return {
		id: 'v1',
		name: { en: 'Lord of Flames', ja: '焔の貴公子' },
		description: { en: 'Big fire damage.', ja: '炎ダメージ' },
		variantRole: 'base',
		ordinal: 1,
		typeColor: 'damage',
		gameIcon: '625_4',
		cooldown: 8,
		initialCooldown: 3,
		...overrides
	}
}

describe('skillToSuggestion', () => {
	const character = { granblue_id: '3040001000', name: { en: 'Percival', ja: 'パーシヴァル' } }

	it('builds a skill token attributed to its character + slot', () => {
		const suggestion = skillToSuggestion(version(), { kind: 'ability', position: 2 }, character)
		expect(suggestion.key).toBe('skill:3040001000:Lord of Flames')
		expect(suggestion.token.type).toBe('skill')
		expect(suggestion.token.skill).toMatchObject({
			slotKind: 'ability',
			slotPosition: 2,
			typeColor: 'damage',
			cooldown: 8,
			initialCooldown: 3,
			character
		})
		expect(suggestion.imageUrl).toBe(`${base}/icons/abilities/625_4.png`)
		expect(suggestion.swatchColor).toBeNull()
		expect(suggestion.primaryLabel).toBe('Lord of Flames')
	})

	it('falls back to a type-color swatch when an ability has no game icon', () => {
		const suggestion = skillToSuggestion(
			version({ gameIcon: null }),
			{ kind: 'ability', position: 1 },
			character
		)
		expect(suggestion.imageUrl).toBeNull()
		expect(suggestion.swatchColor).toBe('#d64545')
	})

	it('uses the static charge-attack icon for ougi (no swatch)', () => {
		const suggestion = skillToSuggestion(
			version({ gameIcon: null }),
			{ kind: 'ougi', position: 1 },
			character
		)
		expect(suggestion.imageUrl).toMatch(/icons\/abilities\/charge-attack\.png$/)
		expect(suggestion.swatchColor).toBeNull()
	})
})
