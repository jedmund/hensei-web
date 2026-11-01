import { describe, it, expect } from 'vitest'
import {
	buildAddToCollectionFilters,
	buildCharacterInputs,
	buildSummonInputs,
	buildWeaponInputs,
	entityNames,
	getMaxLevels,
	hasActiveSearch,
	isCancelledError,
	selectedText,
	selectionCounts,
	uniqueResults,
	type AddToCollectionResult
} from '../add-to-collection.utils'
import type { CollectionFilterState } from '$lib/types/filter'

function result(id: string, extra: Partial<AddToCollectionResult> = {}): AddToCollectionResult {
	return { id, granblueId: id, name: { en: id }, searchableType: 'Weapon', ...extra }
}

const emptyFilters: CollectionFilterState = {
	element: [],
	rarity: [],
	season: [],
	series: [],
	race: [],
	proficiency: [],
	gender: []
}

describe('buildAddToCollectionFilters', () => {
	it('leaves out empty selections', () => {
		expect(buildAddToCollectionFilters(emptyFilters)).toEqual({
			element: undefined,
			rarity: undefined,
			season: undefined,
			series: undefined,
			proficiency: undefined,
			race: undefined,
			gender: undefined
		})
	})

	it('passes chosen filters through', () => {
		const filters = buildAddToCollectionFilters({
			...emptyFilters,
			element: [2],
			rarity: [3],
			season: [1],
			race: [4],
			proficiency: [5],
			gender: [1]
		})
		expect(filters).toMatchObject({
			element: [2],
			rarity: [3],
			season: [1],
			race: [4],
			proficiency: [5],
			gender: [1]
		})
	})

	it('only sends UUID series filters', () => {
		expect(buildAddToCollectionFilters({ ...emptyFilters, series: [3, 'uuid-a'] }).series).toEqual([
			'uuid-a'
		])
		expect(buildAddToCollectionFilters({ ...emptyFilters, series: [3] }).series).toBeUndefined()
	})
})

describe('hasActiveSearch', () => {
	const none = buildAddToCollectionFilters(emptyFilters)

	it('is false with no query and no filters', () => {
		expect(hasActiveSearch('', none)).toBe(false)
	})

	it('is true with a query or any filter', () => {
		expect(hasActiveSearch('gran', none)).toBe(true)
		expect(hasActiveSearch('', { ...none, element: [1] })).toBe(true)
	})
})

describe('uniqueResults', () => {
	it('flattens pages and keeps the first copy of each id', () => {
		const first = result('a', { rarity: 1 })
		const pages = [{ results: [first, result('b')] }, { results: [result('a', { rarity: 2 })] }]
		const results = uniqueResults(pages)
		expect(results.map((r) => r.id)).toEqual(['a', 'b'])
		expect(results[0]).toBe(first)
	})
})

describe('getMaxLevels', () => {
	it('uses the base level without uncap data', () => {
		expect(getMaxLevels(undefined, true)).toEqual({ uncapLevel: 4, transcendenceStep: 0 })
		expect(getMaxLevels(result('w'), false)).toEqual({ uncapLevel: 3, transcendenceStep: 0 })
	})

	it('caps special characters by their own uncaps', () => {
		const special = (uncap: NonNullable<AddToCollectionResult['uncap']>) =>
			getMaxLevels(result('c', { special: true, uncap }), true)
		expect(special({ flb: false })).toEqual({ uncapLevel: 3, transcendenceStep: 0 })
		expect(special({ flb: true })).toEqual({ uncapLevel: 4, transcendenceStep: 0 })
		expect(special({ flb: true, ulb: true })).toEqual({ uncapLevel: 5, transcendenceStep: 0 })
		// Legacy story ULB stored as transcendence
		expect(special({ flb: true, transcendence: true })).toEqual({
			uncapLevel: 5,
			transcendenceStep: 0
		})
	})

	it('maxes transcendence', () => {
		const transcended = { flb: true, ulb: true, transcendence: true }
		expect(getMaxLevels(result('c', { uncap: transcended }), true)).toEqual({
			uncapLevel: 6,
			transcendenceStep: 5
		})
		expect(
			getMaxLevels(result('c', { uncap: { ...transcended, maxTranscendenceStage: 3 } }), true)
		).toEqual({ uncapLevel: 6, transcendenceStep: 3 })
		expect(
			getMaxLevels(result('w', { uncap: { ...transcended, maxTranscendenceStage: 3 } }), false)
		).toEqual({ uncapLevel: 6, transcendenceStep: 5 })
	})

	it('maxes ULB and FLB', () => {
		expect(getMaxLevels(result('w', { uncap: { flb: true, ulb: true } }), false)).toEqual({
			uncapLevel: 5,
			transcendenceStep: 0
		})
		expect(getMaxLevels(result('w', { uncap: { flb: true } }), false)).toEqual({
			uncapLevel: 4,
			transcendenceStep: 0
		})
		expect(getMaxLevels(result('c', { uncap: { flb: true } }), true)).toEqual({
			uncapLevel: 5,
			transcendenceStep: 0
		})
		expect(getMaxLevels(result('c', { uncap: {} }), true)).toEqual({
			uncapLevel: 4,
			transcendenceStep: 0
		})
	})
})

describe('payload builders', () => {
	const results = [result('a', { uncap: { flb: true } }), result('b')]

	it('builds one maxed character entry per selected id', () => {
		expect(buildCharacterInputs(new Set(['a', 'missing']), results)).toEqual([
			{ characterId: 'a', uncapLevel: 5, transcendenceStep: 0 },
			{ characterId: 'missing', uncapLevel: 4, transcendenceStep: 0 }
		])
	})

	it('builds weapon and summon entries with quantities', () => {
		const quantities = new Map([
			['a', 2],
			['b', 1]
		])
		expect(buildWeaponInputs(quantities, results)).toEqual([
			{ weaponId: 'a', quantity: 2, uncapLevel: 4, transcendenceStep: 0 },
			{ weaponId: 'b', quantity: 1, uncapLevel: 3, transcendenceStep: 0 }
		])
		expect(buildSummonInputs(quantities, results)).toEqual([
			{ summonId: 'a', quantity: 2, uncapLevel: 4, transcendenceStep: 0 },
			{ summonId: 'b', quantity: 1, uncapLevel: 3, transcendenceStep: 0 }
		])
	})
})

describe('selection counts and text', () => {
	const quantities = new Map([
		['a', 2],
		['b', 1]
	])

	it('counts characters by id and weapons/summons by copies and items', () => {
		expect(selectionCounts('character', new Set(['x']), quantities)).toEqual({
			count: 1,
			itemCount: 1
		})
		expect(selectionCounts('weapon', new Set(['x']), quantities)).toEqual({
			count: 3,
			itemCount: 2
		})
	})

	it('names characters in the singular or plural', () => {
		const names = entityNames('character')
		expect(selectedText('character', { count: 1, itemCount: 1 }, names)).toBe(
			'1 character selected'
		)
		expect(selectedText('character', { count: 2, itemCount: 2 }, names)).toBe(
			'2 characters selected'
		)
	})

	it('shows total copies for weapons and summons when there are extras', () => {
		const names = entityNames('weapon')
		expect(selectedText('weapon', { count: 0, itemCount: 0 }, names)).toBe('')
		expect(selectedText('weapon', { count: 1, itemCount: 1 }, names)).toBe('1 weapons selected')
		expect(selectedText('summon', { count: 3, itemCount: 2 }, entityNames('summon'))).toBe(
			'2 items (3 total) selected'
		)
	})
})

describe('isCancelledError', () => {
	it('recognises cancellations only', () => {
		expect(isCancelledError({ name: 'CancelledError' })).toBe(true)
		expect(isCancelledError(new Error('boom'))).toBe(false)
		expect(isCancelledError(undefined)).toBe(false)
	})
})
