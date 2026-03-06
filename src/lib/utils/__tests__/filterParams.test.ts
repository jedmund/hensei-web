import { describe, it, expect } from 'vitest'
import {
	parseFiltersFromUrl,
	buildUrlFromFilters,
	hasActiveFilters,
	ELEMENT_TO_PARAM,
	PARAM_TO_ELEMENT,
	RARITY_TO_PARAM,
	PARAM_TO_RARITY,
	PROFICIENCY_TO_PARAM,
	PARAM_TO_PROFICIENCY,
	SEASON_TO_PARAM,
	PARAM_TO_SEASON,
	CHARACTER_SERIES_TO_PARAM,
	PARAM_TO_CHARACTER_SERIES
} from '../filterParams'
import type { CollectionFilterState } from '$lib/components/collection/CollectionFilters.svelte'
import type { WeaponSeries } from '$lib/types/api/weaponSeries'

function emptyFilters(): CollectionFilterState {
	return {
		element: [],
		rarity: [],
		proficiency: [],
		season: [],
		series: [],
		race: [],
		gender: []
	}
}

const MOCK_WEAPON_SERIES: WeaponSeries[] = [
	{
		id: 'ws-1',
		slug: 'dark-opus',
		name: { en: 'Dark Opus', ja: 'オプス' },
		hasWeaponKeys: true,
		hasAwakening: true,
		augmentType: 'no_augment',
		extra: false,
		elementChangeable: false
	},
	{
		id: 'ws-2',
		slug: 'draconic',
		name: { en: 'Draconic', ja: 'ドラゴニック' },
		hasWeaponKeys: true,
		hasAwakening: false,
		augmentType: 'no_augment',
		extra: false,
		elementChangeable: false
	}
] as WeaponSeries[]

// ============================================================================
// Mapping Constants
// ============================================================================

describe('bidirectional mappings', () => {
	it('element mappings are consistent', () => {
		for (const [num, param] of Object.entries(ELEMENT_TO_PARAM)) {
			expect(PARAM_TO_ELEMENT[param]).toBe(Number(num))
		}
	})

	it('rarity mappings are consistent', () => {
		for (const [num, param] of Object.entries(RARITY_TO_PARAM)) {
			expect(PARAM_TO_RARITY[param]).toBe(Number(num))
		}
	})

	it('proficiency mappings are consistent', () => {
		for (const [num, param] of Object.entries(PROFICIENCY_TO_PARAM)) {
			expect(PARAM_TO_PROFICIENCY[param]).toBe(Number(num))
		}
	})

	it('season mappings are consistent', () => {
		for (const [num, param] of Object.entries(SEASON_TO_PARAM)) {
			expect(PARAM_TO_SEASON[param]).toBe(Number(num))
		}
	})

	it('character series mappings are consistent', () => {
		for (const [num, param] of Object.entries(CHARACTER_SERIES_TO_PARAM)) {
			expect(PARAM_TO_CHARACTER_SERIES[param]).toBe(Number(num))
		}
	})
})

// ============================================================================
// parseFiltersFromUrl
// ============================================================================

describe('parseFiltersFromUrl', () => {
	it('returns empty filters for empty params', () => {
		const result = parseFiltersFromUrl(new URLSearchParams(), 'character')
		expect(result.element).toEqual([])
		expect(result.rarity).toEqual([])
		expect(result.proficiency).toEqual([])
		expect(result.season).toEqual([])
		expect(result.series).toEqual([])
		expect(result.searchQuery).toBe('')
		expect(result.page).toBe(1)
	})

	it('parses element filter', () => {
		const params = new URLSearchParams('element=fire,water')
		const result = parseFiltersFromUrl(params, 'character')
		expect(result.element).toEqual([2, 3])
	})

	it('parses rarity filter', () => {
		const params = new URLSearchParams('rarity=ssr')
		const result = parseFiltersFromUrl(params, 'character')
		expect(result.rarity).toEqual([3])
	})

	it('parses proficiency filter', () => {
		const params = new URLSearchParams('proficiency=sabre,katana')
		const result = parseFiltersFromUrl(params, 'character')
		expect(result.proficiency).toEqual([1, 10])
	})

	it('parses season only for characters', () => {
		const charParams = new URLSearchParams('season=summer,valentine')
		expect(parseFiltersFromUrl(charParams, 'character').season).toEqual([3, 1])

		const weaponParams = new URLSearchParams('season=summer')
		expect(parseFiltersFromUrl(weaponParams, 'weapon').season).toEqual([])
	})

	it('parses character series as numeric', () => {
		const params = new URLSearchParams('series=grand,zodiac')
		const result = parseFiltersFromUrl(params, 'character')
		expect(result.series).toEqual([1, 2])
	})

	it('parses weapon series as UUIDs via slug lookup', () => {
		const params = new URLSearchParams('series=dark-opus,draconic')
		const result = parseFiltersFromUrl(params, 'weapon', MOCK_WEAPON_SERIES)
		expect(result.series).toEqual(['ws-1', 'ws-2'])
	})

	it('ignores unknown weapon series slugs', () => {
		const params = new URLSearchParams('series=nonexistent')
		const result = parseFiltersFromUrl(params, 'weapon', MOCK_WEAPON_SERIES)
		expect(result.series).toEqual([])
	})

	it('parses search query', () => {
		const params = new URLSearchParams('q=Yuel')
		const result = parseFiltersFromUrl(params, 'character')
		expect(result.searchQuery).toBe('Yuel')
	})

	it('parses page number', () => {
		const params = new URLSearchParams('page=3')
		const result = parseFiltersFromUrl(params, 'character')
		expect(result.page).toBe(3)
	})

	it('clamps page to minimum 1', () => {
		const params = new URLSearchParams('page=0')
		const result = parseFiltersFromUrl(params, 'character')
		expect(result.page).toBe(1)
	})

	it('ignores invalid values in mappings', () => {
		const params = new URLSearchParams('element=fire,invalid,water')
		const result = parseFiltersFromUrl(params, 'character')
		expect(result.element).toEqual([2, 3])
	})
})

// ============================================================================
// buildUrlFromFilters
// ============================================================================

describe('buildUrlFromFilters', () => {
	it('returns empty params for empty filters', () => {
		const params = buildUrlFromFilters(emptyFilters(), '', 1, 'character')
		expect(params.toString()).toBe('')
	})

	it('builds element param', () => {
		const filters = { ...emptyFilters(), element: [2, 3] }
		const params = buildUrlFromFilters(filters, '', 1, 'character')
		expect(params.get('element')).toBe('fire,water')
	})

	it('builds rarity param', () => {
		const filters = { ...emptyFilters(), rarity: [3] }
		const params = buildUrlFromFilters(filters, '', 1, 'character')
		expect(params.get('rarity')).toBe('ssr')
	})

	it('builds proficiency param', () => {
		const filters = { ...emptyFilters(), proficiency: [1, 10] }
		const params = buildUrlFromFilters(filters, '', 1, 'character')
		expect(params.get('proficiency')).toBe('sabre,katana')
	})

	it('builds season param for characters only', () => {
		const filters = { ...emptyFilters(), season: [3] }
		const charParams = buildUrlFromFilters(filters, '', 1, 'character')
		expect(charParams.get('season')).toBe('summer')

		const weaponParams = buildUrlFromFilters(filters, '', 1, 'weapon')
		expect(weaponParams.get('season')).toBeNull()
	})

	it('builds character series param', () => {
		const filters = { ...emptyFilters(), series: [1, 2] as (number | string)[] }
		const params = buildUrlFromFilters(filters, '', 1, 'character')
		expect(params.get('series')).toBe('grand,zodiac')
	})

	it('builds weapon series param via UUID lookup', () => {
		const filters = {
			...emptyFilters(),
			series: ['ws-1', 'ws-2'] as (number | string)[]
		}
		const params = buildUrlFromFilters(filters, '', 1, 'weapon', MOCK_WEAPON_SERIES)
		expect(params.get('series')).toBe('dark-opus,draconic')
	})

	it('includes search query', () => {
		const params = buildUrlFromFilters(emptyFilters(), 'Yuel', 1, 'character')
		expect(params.get('q')).toBe('Yuel')
	})

	it('trims search query whitespace', () => {
		const params = buildUrlFromFilters(emptyFilters(), '  Yuel  ', 1, 'character')
		expect(params.get('q')).toBe('Yuel')
	})

	it('omits page when 1', () => {
		const params = buildUrlFromFilters(emptyFilters(), '', 1, 'character')
		expect(params.get('page')).toBeNull()
	})

	it('includes page when > 1', () => {
		const params = buildUrlFromFilters(emptyFilters(), '', 3, 'character')
		expect(params.get('page')).toBe('3')
	})
})

// ============================================================================
// hasActiveFilters
// ============================================================================

describe('hasActiveFilters', () => {
	it('returns false when all empty', () => {
		expect(hasActiveFilters(emptyFilters(), '')).toBe(false)
	})

	it('returns true when element is set', () => {
		expect(hasActiveFilters({ ...emptyFilters(), element: [1] }, '')).toBe(true)
	})

	it('returns true when rarity is set', () => {
		expect(hasActiveFilters({ ...emptyFilters(), rarity: [3] }, '')).toBe(true)
	})

	it('returns true when search query is set', () => {
		expect(hasActiveFilters(emptyFilters(), 'search')).toBe(true)
	})

	it('returns false for whitespace-only search', () => {
		expect(hasActiveFilters(emptyFilters(), '   ')).toBe(false)
	})

	it('returns true when race is set', () => {
		expect(hasActiveFilters({ ...emptyFilters(), race: [1] }, '')).toBe(true)
	})

	it('returns true when gender is set', () => {
		expect(hasActiveFilters({ ...emptyFilters(), gender: [1] }, '')).toBe(true)
	})
})
