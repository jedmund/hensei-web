import { describe, it, expect } from 'vitest'
import type { AddItemResult } from '$lib/types/api/search'
import type { Party } from '$lib/types/api/party'
import {
	buildCollectionFilters,
	buildSearchFilters,
	dedupeResultsById,
	partyCollectionIds,
	type SearchFilterInput
} from '../search-filters.utils'

function input(overrides: Partial<SearchFilterInput> = {}): SearchFilterInput {
	return {
		type: 'weapon',
		searchMode: 'all',
		elementFilters: [],
		rarityFilters: [],
		proficiencyFilters: [],
		requiredProficiencies: undefined,
		seriesFilter: undefined,
		subauraFilter: false,
		isExtraSlot: false,
		...overrides
	}
}

describe('buildSearchFilters', () => {
	it('leaves out empty selections', () => {
		expect(buildSearchFilters(input())).toEqual({
			element: undefined,
			rarity: undefined,
			proficiency: undefined,
			series: undefined,
			subaura: undefined,
			extra: undefined
		})
	})

	it('passes through chosen elements, rarities and series', () => {
		const filters = buildSearchFilters(
			input({ elementFilters: [2, 3], rarityFilters: [3], seriesFilter: 'series-uuid' })
		)
		expect(filters.element).toEqual([2, 3])
		expect(filters.rarity).toEqual([3])
		expect(filters.series).toEqual(['series-uuid'])
	})

	it('sets the subaura and extra flags only when true', () => {
		const filters = buildSearchFilters(input({ subauraFilter: true, isExtraSlot: true }))
		expect(filters.subaura).toBe(true)
		expect(filters.extra).toBe(true)
	})

	it('lets required proficiencies override the user’s choice on the catalogue search', () => {
		const filters = buildSearchFilters(
			input({ proficiencyFilters: [1], requiredProficiencies: [4, 5] })
		)
		expect(filters.proficiency).toEqual([4, 5])
	})

	it('falls back to the user’s proficiencies without a requirement', () => {
		expect(buildSearchFilters(input({ proficiencyFilters: [1] })).proficiency).toEqual([1])
	})

	it('ignores required proficiencies on a collection search', () => {
		const base = { searchMode: 'collection' as const, requiredProficiencies: [4, 5] }
		expect(buildSearchFilters(input(base)).proficiency).toBeUndefined()
		expect(buildSearchFilters(input({ ...base, proficiencyFilters: [2] })).proficiency).toEqual([2])
	})

	it('applies proficiency to characters but never to summons', () => {
		expect(
			buildSearchFilters(input({ type: 'character', proficiencyFilters: [1] })).proficiency
		).toEqual([1])
		expect(
			buildSearchFilters(
				input({ type: 'summon', proficiencyFilters: [1], requiredProficiencies: [2] })
			).proficiency
		).toBeUndefined()
	})
})

describe('buildCollectionFilters', () => {
	const filters = buildSearchFilters(
		input({ elementFilters: [1], rarityFilters: [3], proficiencyFilters: [2], seriesFilter: 's' })
	)

	it('runs unfiltered outside collection mode', () => {
		expect(buildCollectionFilters(filters, 'all', 'query')).toEqual({})
	})

	it('maps the filters and query in collection mode', () => {
		expect(buildCollectionFilters(filters, 'collection', 'gran')).toEqual({
			element: [1],
			rarity: [3],
			proficiency: [2],
			series: ['s'],
			search: 'gran'
		})
	})

	it('drops an empty query', () => {
		expect(buildCollectionFilters(filters, 'collection', '').search).toBeUndefined()
	})
})

describe('dedupeResultsById', () => {
	const item = (id: string, name: string) =>
		({ id, granblueId: id, name: { en: name } }) as AddItemResult

	it('keeps one result per id, in first-seen order', () => {
		const results = dedupeResultsById([item('a', 'A1'), item('b', 'B'), item('a', 'A2')])
		expect(results.map((r) => r.id)).toEqual(['a', 'b'])
		// Map semantics: the later copy replaces the earlier one
		expect(results[0]?.name).toEqual({ en: 'A2' })
	})
})

describe('partyCollectionIds', () => {
	it('is empty without a party', () => {
		expect(partyCollectionIds(undefined).size).toBe(0)
		expect(partyCollectionIds(null).size).toBe(0)
	})

	it('collects linked collection ids across all three grids', () => {
		const party = {
			weapons: [{ collectionWeaponId: 'cw1' }, {}],
			characters: [{ collectionCharacterId: 'cc1' }],
			summons: [{ collectionSummonId: 'cs1' }, { collectionSummonId: undefined }]
		} as unknown as Pick<Party, 'weapons' | 'characters' | 'summons'>
		expect([...partyCollectionIds(party)].sort()).toEqual(['cc1', 'cs1', 'cw1'])
	})
})
