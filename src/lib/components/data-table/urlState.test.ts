import { describe, it, expect } from 'vitest'
import {
	decodeSort,
	encodeSort,
	parseTableUrl,
	updateTableState,
	writeTableUrl,
	defaultTableState,
	type TableUrlConfig
} from './urlState'

const config: TableUrlConfig = {
	filters: [
		{ key: 'element', kind: 'multi' },
		{ key: 'missing_name_jp', kind: 'boolean' },
		{ key: 'release_date', kind: 'range' }
	],
	defaultPer: 50
}

const params = (query: string) => new URLSearchParams(query)

describe('sort encoding', () => {
	it('round-trips multi-column sort and keeps order', () => {
		const sort = [
			{ id: 'updated_at', desc: true },
			{ id: 'name_en', desc: false }
		]
		expect(encodeSort(sort)).toBe('-updated_at,name_en')
		expect(decodeSort('-updated_at,name_en')).toEqual(sort)
	})

	it('drops empty tokens and duplicate columns', () => {
		expect(decodeSort('name,,-name, -')).toEqual([{ id: 'name', desc: false }])
		expect(decodeSort(null)).toEqual([])
	})
})

describe('parseTableUrl', () => {
	it('returns defaults for an empty query', () => {
		expect(parseTableUrl(params(''), config)).toEqual(defaultTableState(config))
	})

	it('reads page, per, sort, search and every filter kind', () => {
		const state = parseTableUrl(
			params(
				'q=%20dark%20&sort=-updated_at,name_en&page=3&per=100&element=1,2&missing_name_jp=true&release_date=2024-01-01..2024-12-31'
			),
			config
		)
		expect(state).toEqual({
			page: 3,
			per: 100,
			sort: [
				{ id: 'updated_at', desc: true },
				{ id: 'name_en', desc: false }
			],
			q: 'dark',
			filters: {
				element: ['1', '2'],
				missing_name_jp: true,
				release_date: { gte: '2024-01-01', lte: '2024-12-31' }
			}
		})
	})

	it('accepts open-ended ranges', () => {
		expect(parseTableUrl(params('release_date=..2024-12-31'), config).filters).toEqual({
			release_date: { lte: '2024-12-31' }
		})
		expect(parseTableUrl(params('release_date=2024-01-01..'), config).filters).toEqual({
			release_date: { gte: '2024-01-01' }
		})
	})

	it('falls back on invalid page and page size values', () => {
		const state = parseTableUrl(params('page=0&per=37'), config)
		expect(state.page).toBe(1)
		expect(state.per).toBe(50)
		expect(parseTableUrl(params('page=abc'), config).page).toBe(1)
	})

	it('ignores undeclared filter keys and invalid booleans', () => {
		const state = parseTableUrl(params('rarity=3&missing_name_jp=maybe'), config)
		expect(state.filters).toEqual({})
	})

	it('uses the default sort unless the URL clears it', () => {
		const withDefault = { ...config, defaultSort: [{ id: 'order', desc: false }] }
		expect(parseTableUrl(params(''), withDefault).sort).toEqual([{ id: 'order', desc: false }])
		expect(parseTableUrl(params('sort='), withDefault).sort).toEqual([])
	})

	it('rejects filter keys that collide with reserved params', () => {
		expect(() => parseTableUrl(params(''), { filters: [{ key: 'view', kind: 'multi' }] })).toThrow(
			/reserved/
		)
	})
})

describe('writeTableUrl', () => {
	it('omits defaults', () => {
		expect(writeTableUrl(defaultTableState(config), params(''), config).toString()).toBe('')
	})

	it('preserves params it does not own, like view and open', () => {
		const state = { ...defaultTableState(config), q: 'opus', page: 2 }
		const next = writeTableUrl(state, params('view=series&open=1040001000&page=5'), config)
		expect(next.get('view')).toBe('series')
		expect(next.get('open')).toBe('1040001000')
		expect(next.get('q')).toBe('opus')
		expect(next.get('page')).toBe('2')
	})

	it('removes filters that were cleared', () => {
		const next = writeTableUrl(
			defaultTableState(config),
			params('element=1,2&missing_name_jp=true'),
			config
		)
		expect(next.has('element')).toBe(false)
		expect(next.has('missing_name_jp')).toBe(false)
	})

	it('round-trips through parse', () => {
		const state = {
			page: 4,
			per: 200,
			sort: [
				{ id: 'release_date', desc: true },
				{ id: 'name_en', desc: false }
			],
			q: 'bahamut',
			filters: {
				element: ['3'],
				missing_name_jp: false,
				release_date: { gte: '2023-06-01' }
			}
		}
		expect(parseTableUrl(writeTableUrl(state, params('view=series'), config), config)).toEqual(
			state
		)
	})

	it('writes an empty sort when the default sort is cleared', () => {
		const withDefault = { ...config, defaultSort: [{ id: 'order', desc: false }] }
		const cleared = { ...defaultTableState(withDefault), sort: [] }
		expect(writeTableUrl(cleared, params(''), withDefault).toString()).toBe('sort=')
		// and the default sort itself is omitted
		expect(writeTableUrl(defaultTableState(withDefault), params(''), withDefault).toString()).toBe(
			''
		)
	})
})

describe('updateTableState', () => {
	const base = { ...defaultTableState(config), page: 4 }

	it('returns to page 1 when search, sort, filters or page size change', () => {
		expect(updateTableState(base, { q: 'x' }).page).toBe(1)
		expect(updateTableState(base, { sort: [{ id: 'name_en', desc: false }] }).page).toBe(1)
		expect(updateTableState(base, { filters: { element: ['1'] } }).page).toBe(1)
		expect(updateTableState(base, { per: 100 }).page).toBe(1)
	})

	it('keeps the page for unchanged values and explicit page changes', () => {
		expect(updateTableState(base, { q: '' }).page).toBe(4)
		expect(updateTableState(base, { page: 5 }).page).toBe(5)
	})
})
