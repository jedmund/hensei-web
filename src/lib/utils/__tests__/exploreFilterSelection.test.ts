import { describe, it, expect } from 'vitest'
import {
	addFilterOption,
	buildPlaceholderSuggestions,
	getExploreCategoryLabels,
	isFilterSelected,
	lastUnpinnedIndex,
	relabelFilters,
	removeFilterAt,
	searchResultToOption,
	toggleEntityModeAt
} from '../exploreFilterSelection'
import type { FilterItem, FilterOption } from '$lib/types/filter'
import type { RaidFull } from '$lib/types/api/raid'

const entity: FilterItem = {
	kind: 'entity',
	value: 'uuid-1',
	label: 'Katalina',
	entityType: 'character',
	granblueId: '3040000000',
	mode: 'include'
}

function option(o: Partial<FilterOption> & Pick<FilterOption, 'kind' | 'value'>): FilterOption {
	return { label: String(o.value), category: 'Cat', ...o }
}

describe('isFilterSelected', () => {
	it('matches entities by granblueId, not value', () => {
		expect(
			isFilterSelected(
				[entity],
				option({ kind: 'entity', value: 'other-uuid', granblueId: '3040000000' })
			)
		).toBe(true)
	})

	it('matches other kinds by kind + value', () => {
		const filters: FilterItem[] = [{ kind: 'element', value: 2, label: 'Fire' }]
		expect(isFilterSelected(filters, option({ kind: 'element', value: 2 }))).toBe(true)
		expect(isFilterSelected(filters, option({ kind: 'element', value: 3 }))).toBe(false)
		expect(isFilterSelected(filters, option({ kind: 'recency', value: 2 }))).toBe(false)
	})
})

describe('addFilterOption', () => {
	it('returns null when the option is already selected', () => {
		const filters: FilterItem[] = [{ kind: 'raid', value: 'r1', label: 'Raid' }]
		expect(addFilterOption(filters, option({ kind: 'raid', value: 'r1' }))).toBeNull()
	})

	it('appends multi-select kinds', () => {
		const filters: FilterItem[] = [{ kind: 'element', value: 2, label: 'Fire' }]
		const next = addFilterOption(filters, option({ kind: 'element', value: 3, label: 'Water' }))
		expect(next).toEqual([
			{ kind: 'element', value: 2, label: 'Fire' },
			{ kind: 'element', value: 3, label: 'Water' }
		])
		expect(filters).toHaveLength(1)
	})

	it.each(['recency', 'boost', 'side', 'evoker', 'label'] as const)(
		'replaces the existing %s filter',
		(kind) => {
			const filters = [
				{ kind, value: 'old', label: 'Old' } as FilterItem,
				{ kind: 'element', value: 1, label: 'Wind' } as FilterItem
			]
			const next = addFilterOption(filters, option({ kind, value: 'new', label: 'New' }))
			expect(next).toEqual([
				{ kind: 'element', value: 1, label: 'Wind' },
				{ kind, value: 'new', label: 'New' }
			])
		}
	)

	it('adds an entity as include, keeping its type, id and element', () => {
		const next = addFilterOption(
			[],
			option({
				kind: 'entity',
				value: 'uuid-2',
				label: 'Lecia',
				entityType: 'character',
				granblueId: '3040111000',
				element: 3,
				category: 'Character'
			})
		)
		expect(next).toEqual([
			{
				kind: 'entity',
				value: 'uuid-2',
				label: 'Lecia',
				entityType: 'character',
				granblueId: '3040111000',
				mode: 'include',
				element: 3
			}
		])
	})

	it.each(['raid', 'class', 'difficulty', 'party'] as const)('appends %s with label', (kind) => {
		expect(addFilterOption([], option({ kind, value: 'x', label: 'X' }))).toEqual([
			{ kind, value: 'x', label: 'X' }
		])
	})
})

describe('removeFilterAt', () => {
	it('removes the filter at the index', () => {
		const filters: FilterItem[] = [entity, { kind: 'element', value: 2, label: 'Fire' }]
		expect(removeFilterAt(filters, 0)).toEqual([{ kind: 'element', value: 2, label: 'Fire' }])
	})

	it('leaves pinned filters alone', () => {
		const filters: FilterItem[] = [{ kind: 'raid', value: 'r1', label: 'Raid', pinned: true }]
		expect(removeFilterAt(filters, 0)).toBeNull()
	})
})

describe('lastUnpinnedIndex', () => {
	it('skips trailing pinned filters', () => {
		const filters: FilterItem[] = [
			{ kind: 'element', value: 2, label: 'Fire' },
			{ kind: 'raid', value: 'r1', label: 'Raid', pinned: true }
		]
		expect(lastUnpinnedIndex(filters)).toBe(0)
	})

	it('is -1 when nothing can be removed', () => {
		expect(lastUnpinnedIndex([])).toBe(-1)
		expect(lastUnpinnedIndex([{ kind: 'raid', value: 'r1', label: 'Raid', pinned: true }])).toBe(-1)
	})
})

describe('toggleEntityModeAt', () => {
	it('flips include and exclude', () => {
		const once = toggleEntityModeAt([entity], 0)
		expect(once?.[0]).toMatchObject({ mode: 'exclude' })
		expect(toggleEntityModeAt(once!, 0)?.[0]).toMatchObject({ mode: 'include' })
	})

	it('ignores non-entity filters', () => {
		expect(toggleEntityModeAt([{ kind: 'element', value: 2, label: 'Fire' }], 0)).toBeNull()
	})
})

describe('relabelFilters', () => {
	const tiers: Record<string, string> = { casual: 'Casual', mid: 'Intermediate' }
	const resolve = (value: FilterItem['value']) => tiers[String(value)]

	it('swaps placeholder labels of the given kind', () => {
		const filters: FilterItem[] = [
			{ kind: 'difficulty', value: 'mid', label: 'mid' },
			{ kind: 'label', value: 'mid', label: 'mid' }
		]
		expect(relabelFilters(filters, 'difficulty', resolve)).toEqual([
			{ kind: 'difficulty', value: 'mid', label: 'Intermediate' },
			{ kind: 'label', value: 'mid', label: 'mid' }
		])
	})

	it('keeps labels that were already resolved', () => {
		const filters: FilterItem[] = [{ kind: 'difficulty', value: 'mid', label: 'Custom' }]
		expect(relabelFilters(filters, 'difficulty', resolve)).toBeNull()
	})

	it('returns null when the value is unknown', () => {
		const filters: FilterItem[] = [{ kind: 'difficulty', value: 'gone', label: 'gone' }]
		expect(relabelFilters(filters, 'difficulty', resolve)).toBeNull()
	})
})

describe('searchResultToOption', () => {
	it('maps a search result to an entity option', () => {
		const result = searchResultToOption({
			searchableId: 'uuid-3',
			searchableType: 'Weapon',
			granblueId: '1040000000',
			nameEn: 'Sword',
			nameJp: '剣',
			element: 2
		})
		expect(result).toMatchObject({
			kind: 'entity',
			value: 'uuid-3',
			label: 'Sword',
			entityType: 'weapon',
			granblueId: '1040000000',
			element: 2
		})
	})
})

describe('buildPlaceholderSuggestions', () => {
	const categoryLabels = getExploreCategoryLabels()
	const first = <T>(arr: T[]) => arr[0]
	const raids = [
		{ id: 'r1', slug: 'raid-one', name: { en: 'Raid One', ja: 'レイド1' } },
		{ id: 'r2', slug: 'raid-two', name: { en: 'Raid Two', ja: 'レイド2' } }
	] as unknown as RaidFull[]
	const base = {
		filters: [] as FilterItem[],
		excludedKinds: [] as FilterItem['kind'][],
		categoryLabels,
		evokerSuggestions: [option({ kind: 'evoker', value: '3040', label: 'Evoker' })],
		elementSuggestions: [option({ kind: 'element', value: 2, label: 'Fire' })],
		allRaids: raids,
		labelOptions: [{ value: 'fast', label: 'Fast' }],
		entity: option({ kind: 'entity', value: 'uuid', label: 'Entity' }),
		pick: first
	}

	it('orders evokers, element, raid, label, recency, entity, then party', () => {
		const kinds = buildPlaceholderSuggestions(base).map((s) => s.option?.kind)
		expect(kinds).toEqual([
			'evoker',
			'element',
			'raid',
			'label',
			'recency',
			'entity',
			'party',
			'party',
			'party'
		])
	})

	it('skips raids already filtered by', () => {
		const suggestions = buildPlaceholderSuggestions({
			...base,
			filters: [{ kind: 'raid', value: 'r1', label: 'Raid One' }]
		})
		expect(suggestions.find((s) => s.option?.kind === 'raid')?.option?.value).toBe('r2')
	})

	it('offers no label while one is set', () => {
		const suggestions = buildPlaceholderSuggestions({
			...base,
			filters: [{ kind: 'label', value: 'fast', label: 'Fast' }]
		})
		expect(suggestions.some((s) => s.option?.kind === 'label')).toBe(false)
	})

	it('honours excluded kinds', () => {
		const suggestions = buildPlaceholderSuggestions({
			...base,
			excludedKinds: ['element', 'raid', 'label', 'recency', 'entity', 'party']
		})
		expect(suggestions.map((s) => s.option?.kind)).toEqual(['evoker'])
	})

	it('uses the option category for each suggestion', () => {
		const raid = buildPlaceholderSuggestions(base).find((s) => s.option?.kind === 'raid')
		expect(raid?.category).toBe(categoryLabels.raid)
		expect(raid?.label).toBe('Raid One')
	})
})
