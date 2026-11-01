import { describe, it, expect } from 'vitest'
import {
	COLLECTION_FILTER_KEYS,
	GENDER_OPTIONS,
	MAX_VISIBLE_FILTERS,
	countSelectedValues,
	emptyCollectionFilterState,
	getCollectionSortOptions,
	resolveFilterVisibility,
	seriesToOptions,
	splitFilterConfigs,
	toggleFilterValue
} from '../collectionFilterOptions'
import type { CollectionFilterConfig, CollectionFilterKey } from '$lib/types/filter'

function config(key: CollectionFilterKey, value: (number | string)[] = []): CollectionFilterConfig {
	return { key, options: [], value, onChange: () => {}, placeholder: key }
}

describe('resolveFilterVisibility', () => {
	it('uses the entity defaults', () => {
		expect(resolveFilterVisibility('summon')).toEqual({
			element: true,
			rarity: true,
			season: false,
			series: true,
			race: false,
			proficiency: false,
			gender: false
		})
	})

	it('lets explicit flags override the defaults', () => {
		const v = resolveFilterVisibility('character', { season: false, rarity: false })
		expect(v.season).toBe(false)
		expect(v.rarity).toBe(false)
		expect(v.race).toBe(true)
	})
})

describe('emptyCollectionFilterState', () => {
	it('has an empty array for every key', () => {
		const state = emptyCollectionFilterState()
		expect(Object.keys(state).sort()).toEqual([...COLLECTION_FILTER_KEYS].sort())
		expect(Object.values(state).every((v) => v.length === 0)).toBe(true)
	})

	it('returns a fresh object each time', () => {
		expect(emptyCollectionFilterState()).not.toBe(emptyCollectionFilterState())
	})
})

describe('getCollectionSortOptions', () => {
	it('includes proficiency sorts for characters and weapons', () => {
		for (const type of ['character', 'weapon'] as const) {
			const values = getCollectionSortOptions(type).map((o) => o.value)
			expect(values).toContain('proficiency_asc')
			expect(values).toContain('proficiency_desc')
			expect(values).toHaveLength(8)
		}
	})

	it('drops proficiency sorts for summons', () => {
		const values = getCollectionSortOptions('summon').map((o) => o.value)
		expect(values).toEqual([
			'name_asc',
			'name_desc',
			'element_asc',
			'element_desc',
			'release_date_asc',
			'release_date_desc'
		])
	})
})

describe('GENDER_OPTIONS', () => {
	it('leaves out Unknown', () => {
		expect(GENDER_OPTIONS.map((o) => o.value)).toEqual([1, 2, 3])
	})
})

describe('seriesToOptions', () => {
	it('returns [] while the list is loading', () => {
		expect(seriesToOptions(undefined)).toEqual([])
	})

	it('orders by display order without mutating the input', () => {
		const series = [
			{ id: 'b', order: 2, name: { en: 'Beta', ja: 'ベータ' } },
			{ id: 'a', order: 1, name: { en: 'Alpha', ja: 'アルファ' } }
		]
		const options = seriesToOptions(series)
		expect(options.map((o) => o.value)).toEqual(['a', 'b'])
		expect(series.map((s) => s.id)).toEqual(['b', 'a'])
	})
})

describe('toggleFilterValue', () => {
	it('adds a missing value', () => {
		expect(toggleFilterValue([1], 2)).toEqual([1, 2])
	})

	it('removes a present value', () => {
		expect(toggleFilterValue([1, 2, 3], 2)).toEqual([1, 3])
	})
})

describe('splitFilterConfigs', () => {
	const configs = COLLECTION_FILTER_KEYS.map((key) => config(key))

	it('keeps only visible groups, the first few inline and the rest under More', () => {
		const { active, visible, more } = splitFilterConfigs(
			configs,
			resolveFilterVisibility('character')
		)
		expect(active.map((c) => c.key)).toEqual(COLLECTION_FILTER_KEYS)
		expect(visible.map((c) => c.key)).toEqual(['element', 'rarity', 'season'])
		expect(visible).toHaveLength(MAX_VISIBLE_FILTERS)
		expect(more.map((c) => c.key)).toEqual(['series', 'race', 'proficiency', 'gender'])
	})

	it('has no overflow when few groups are visible', () => {
		const { visible, more } = splitFilterConfigs(configs, resolveFilterVisibility('summon'))
		expect(visible.map((c) => c.key)).toEqual(['element', 'rarity', 'series'])
		expect(more).toEqual([])
	})
})

describe('countSelectedValues', () => {
	it('sums the selections across groups', () => {
		expect(countSelectedValues([config('element', [1, 2]), config('series', ['x'])])).toBe(3)
	})
})
