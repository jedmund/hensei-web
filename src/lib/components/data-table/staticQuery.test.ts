import { describe, it, expect, vi } from 'vitest'

vi.mock('$lib/paraglide/runtime.js', () => ({ getLocale: () => 'en' }))

import { applyStaticQuery, filterRows, searchRows, sortRows, staticFilters } from './staticQuery'
import type { DataTableColumn } from './types'

interface Row {
	id: string
	name: { en: string; ja: string }
	order: number | null
	slug: string
	extra: boolean
	element: number
	releaseDate: string | null
}

const rows: Row[] = [
	{
		id: 'a',
		name: { en: 'Dark Opus', ja: 'ダーク・オーパス' },
		order: 3,
		slug: 'dark-opus',
		extra: false,
		element: 5,
		releaseDate: '2019-03-01'
	},
	{
		id: 'b',
		name: { en: 'Ultima', ja: 'オメガ' },
		order: 1,
		slug: 'ultima',
		extra: false,
		element: 0,
		releaseDate: '2018-06-01'
	},
	{
		id: 'c',
		name: { en: 'Draconic', ja: 'ドラコニック' },
		order: null,
		slug: 'draconic',
		extra: true,
		element: 2,
		releaseDate: null
	},
	{
		id: 'd',
		name: { en: 'Item 10', ja: 'アイテム10' },
		order: 3,
		slug: 'item-10',
		extra: true,
		element: 5,
		releaseDate: '2024-01-15'
	},
	{
		id: 'e',
		name: { en: 'Item 9', ja: 'アイテム9' },
		order: 2,
		slug: 'item-9',
		extra: false,
		element: 1,
		releaseDate: '2024-02-01'
	}
]

const columns: DataTableColumn<Row>[] = [
	{ id: 'order', header: 'Order', type: 'number', value: (r) => r.order },
	{ id: 'name', header: 'Name', type: 'name', name: (r) => r.name },
	{ id: 'slug', header: 'Slug', type: 'code', value: (r) => r.slug },
	{ id: 'release_date', header: 'Released', type: 'date', value: (r) => r.releaseDate },
	{ id: 'extra', header: 'Extra', type: 'boolean', value: (r) => r.extra },
	{ id: 'flags', header: 'Flags', type: 'flags', flags: () => [] }
]

const ids = (list: Row[]) => list.map((r) => r.id)

describe('sortRows', () => {
	it('sorts numbers ascending and descending with empty values last', () => {
		expect(ids(sortRows(rows, [{ id: 'order', desc: false }], columns))).toEqual([
			'b',
			'e',
			'a',
			'd',
			'c'
		])
		expect(ids(sortRows(rows, [{ id: 'order', desc: true }], columns))).toEqual([
			'a',
			'd',
			'e',
			'b',
			'c'
		])
	})

	it('uses the next sort column to break ties', () => {
		expect(
			ids(
				sortRows(
					rows,
					[
						{ id: 'order', desc: true },
						{ id: 'name', desc: true }
					],
					columns
				)
			)
		).toEqual(['d', 'a', 'e', 'b', 'c'])
	})

	it('sorts names naturally (Item 9 before Item 10)', () => {
		const sorted = ids(sortRows(rows, [{ id: 'name', desc: false }], columns))
		expect(sorted.indexOf('e')).toBeLessThan(sorted.indexOf('d'))
	})

	it('sorts dates chronologically', () => {
		expect(ids(sortRows(rows, [{ id: 'release_date', desc: true }], columns))).toEqual([
			'e',
			'd',
			'a',
			'b',
			'c'
		])
	})

	it('ignores unknown and unsortable columns', () => {
		expect(sortRows(rows, [{ id: 'nope', desc: false }], columns)).toBe(rows)
		expect(sortRows(rows, [{ id: 'flags', desc: false }], columns)).toBe(rows)
	})

	it('does not mutate the input', () => {
		const copy = [...rows]
		sortRows(rows, [{ id: 'order', desc: false }], columns)
		expect(rows).toEqual(copy)
	})
})

describe('searchRows', () => {
	it('matches either locale of a name, case-insensitively', () => {
		expect(ids(searchRows(rows, 'opus', columns))).toEqual(['a'])
		expect(ids(searchRows(rows, 'オメガ', columns))).toEqual(['b'])
	})

	it('requires every term to match', () => {
		expect(ids(searchRows(rows, 'item 10', columns))).toEqual(['d'])
	})

	it('only searches text and name columns unless told otherwise', () => {
		// slug is a code column, so it is not searched by default
		expect(searchRows(rows, 'draconic', columns).length).toBe(1)
		expect(searchRows(rows, 'item-9', columns)).toEqual([])
		const withSlug = columns.map((c) => (c.id === 'slug' ? { ...c, searchable: true } : c))
		expect(ids(searchRows(rows, 'item-9', withSlug))).toEqual(['e'])
	})

	it('returns all rows for an empty query', () => {
		expect(searchRows(rows, '  ', columns)).toBe(rows)
	})
})

describe('filterRows', () => {
	const predicates = {
		element: staticFilters.oneOf<Row>((r) => r.element),
		extra: staticFilters.is<Row>((r) => r.extra),
		release_date: staticFilters.between<Row>((r) => r.releaseDate),
		order: staticFilters.between<Row>((r) => r.order)
	}

	it('applies multi, boolean and range filters together', () => {
		expect(ids(filterRows(rows, { element: ['5', '2'] }, predicates))).toEqual(['a', 'c', 'd'])
		expect(ids(filterRows(rows, { element: ['5'], extra: true }, predicates))).toEqual(['d'])
		expect(ids(filterRows(rows, { extra: false }, predicates))).toEqual(['a', 'b', 'e'])
	})

	it('treats range bounds as inclusive and excludes empty values', () => {
		expect(
			ids(filterRows(rows, { release_date: { gte: '2019-03-01', lte: '2024-01-15' } }, predicates))
		).toEqual(['a', 'd'])
		expect(ids(filterRows(rows, { order: { gte: '2' } }, predicates))).toEqual(['a', 'd', 'e'])
	})

	it('ignores filters without a predicate', () => {
		expect(filterRows(rows, { rarity: ['3'] }, predicates)).toBe(rows)
	})
})

describe('applyStaticQuery', () => {
	it('searches, filters, then sorts', () => {
		const result = applyStaticQuery(
			rows,
			{ q: 'item', filters: { extra: false }, sort: [{ id: 'order', desc: true }] },
			{ columns, filters: { extra: staticFilters.is<Row>((r) => r.extra) } }
		)
		expect(ids(result)).toEqual(['e'])
	})
})
