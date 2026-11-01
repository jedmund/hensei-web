import { describe, it, expect, vi, afterEach } from 'vitest'
import { QueryClient } from '@tanstack/svelte-query'
import { buildListParams, fetchListPage, requestedFields } from './serverParams'
import { adminKeys, adminQueries } from '$lib/api/queries/admin.queries'
import { AdminAdapter, adminAdapter, toAdminListQuery } from '$lib/api/adapters/admin.adapter'
import { mockApiResponse } from '$lib/api/adapters/__tests__/fixtures/helpers'
import type { DataTableColumn } from './types'
import { defaultTableState, parseTableUrl, type TableUrlConfig } from './urlState'

import type { AdminWeaponRow } from '$lib/types/api/admin'

type Weapon = AdminWeaponRow

const columns: DataTableColumn<Weapon>[] = [
	{ id: 'name_en', header: 'Name', type: 'name', name: (w) => ({ en: w.nameEn, ja: w.nameJp }) },
	{ id: 'updated_at', header: 'Updated', type: 'date', value: (w) => w.updatedAt },
	{
		id: 'released',
		header: 'Released',
		type: 'date',
		value: () => null,
		sortField: 'release_date'
	},
	{ id: 'thumb', header: '', type: 'image', image: 'weapon', sortable: false }
]

const config: TableUrlConfig = {
	filters: [
		{ key: 'element', kind: 'multi' },
		{ key: 'no_skills', kind: 'boolean' },
		{ key: 'updated_at', kind: 'range' },
		{ key: 'release_date', kind: 'range' }
	]
}

const stateFrom = (query: string) => parseTableUrl(new URLSearchParams(query), config)

describe('buildListParams', () => {
	it('sends only page and per for a fresh table', () => {
		expect(buildListParams(defaultTableState(config), { columns })).toEqual({ page: 1, per: 50 })
	})

	it('maps sort ids to API fields and drops unknown or unsortable columns', () => {
		const params = buildListParams(stateFrom('sort=-updated_at,released,thumb,bogus,name_en'), {
			columns
		})
		expect(params.sort).toBe('-updated_at,release_date,name_en')
	})

	it('normalizes filters so equal state gives an equal query key', () => {
		const a = buildListParams(stateFrom('element=2,1,2&no_skills=true&q=%20opus%20'), {
			columns
		})
		const b = buildListParams(stateFrom('no_skills=true&element=1,2&q=opus'), { columns })
		expect(a).toEqual(b)
		expect(JSON.stringify(adminKeys.list('weapons', a))).toBe(
			JSON.stringify(adminKeys.list('weapons', b))
		)
		expect(a).toEqual({
			page: 1,
			per: 50,
			q: 'opus',
			filters: { element: ['1', '2'], no_skills: true }
		})
	})

	it('passes fields and facets through', () => {
		const params = buildListParams(stateFrom('page=3&per=100'), {
			columns,
			fields: ['granblue_id', 'name_en'],
			facets: ['element', 'rarity']
		})
		expect(params).toEqual({
			page: 3,
			per: 100,
			fields: ['granblue_id', 'name_en'],
			facets: ['element', 'rarity']
		})
	})
})

describe('requestedFields', () => {
	const withFields: DataTableColumn<Weapon>[] = [
		{
			id: 'name',
			header: 'Name',
			type: 'name',
			name: (w) => ({ en: w.nameEn }),
			fields: ['name_en']
		},
		{
			id: 'skills',
			header: 'Skills',
			type: 'number',
			value: (w) => w.skillCount,
			fields: ['skill_count']
		},
		{ id: 'thumb', header: '', type: 'image', image: 'weapon' }
	]

	it('adds the visible columns’ fields to the base fields, sorted', () => {
		expect(
			requestedFields({
				columns: withFields,
				fields: ['granblue_id', 'name_en'],
				visibleColumnIds: ['name', 'thumb']
			})
		).toEqual(['granblue_id', 'name_en'])
		expect(
			requestedFields({
				columns: withFields,
				fields: ['granblue_id'],
				visibleColumnIds: ['skills', 'name']
			})
		).toEqual(['granblue_id', 'name_en', 'skill_count'])
	})

	it('uses every column until the visible set is known', () => {
		expect(requestedFields({ columns: withFields, visibleColumnIds: null })).toEqual([
			'name_en',
			'skill_count'
		])
	})

	it('sends the trimmed list as fields=', () => {
		const params = buildListParams(defaultTableState(config), {
			columns: withFields,
			fields: ['granblue_id'],
			visibleColumnIds: ['name']
		})
		expect(params.fields).toEqual(['granblue_id', 'name_en'])
	})
})

describe('admin list query', () => {
	it('keys by resource and params', () => {
		const params = { page: 2, per: 50, q: 'opus' }
		expect(adminQueries.list('weapons', params).queryKey).toEqual([
			'admin',
			'weapons',
			'list',
			params
		])
	})

	it('flattens params into the bracketed wire format', () => {
		expect(
			toAdminListQuery({
				page: 1,
				per: 50,
				q: 'dark',
				sort: '-updated_at,name_en',
				filters: {
					element: ['1', '2'],
					release_date: { gte: '2024-01-01' },
					no_skills: true
				},
				fields: ['granblue_id', 'name_en'],
				facets: ['element', 'rarity']
			})
		).toEqual({
			q: 'dark',
			'filter[element]': '1,2',
			'filter[release_date][gte]': '2024-01-01',
			'filter[no_skills]': 'true',
			sort: '-updated_at,name_en',
			page: '1',
			per: '50',
			fields: 'granblue_id,name_en',
			facets: 'element,rarity'
		})
	})
})

describe('AdminAdapter.list', () => {
	const originalFetch = global.fetch
	afterEach(() => {
		global.fetch = originalFetch
	})

	const apiResponse = {
		results: [{ granblue_id: '1040001000', name_en: 'Bahamut Sword', updated_at: '2026-10-01' }],
		meta: { total: 312, page: 2, per: 50, total_pages: 7 },
		facets: { element: { '1': 40, '2': 52 } }
	}

	it('requests the endpoint with bracketed filters and camelCases the response', async () => {
		global.fetch = mockApiResponse(apiResponse)
		const adapter = new AdminAdapter({ baseURL: 'https://api.example.com' })

		const result = await adapter.listWeapons({
			page: 2,
			per: 50,
			sort: '-updated_at',
			filters: { element: ['1', '2'], updated_at: { lte: '2024-12-31' } },
			facets: ['element']
		})

		const url = new URL((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string)
		expect(url.pathname).toBe('/admin/weapons')
		expect(Object.fromEntries(url.searchParams)).toEqual({
			'filter[element]': '1,2',
			'filter[updated_at][lte]': '2024-12-31',
			sort: '-updated_at',
			page: '2',
			per: '50',
			facets: 'element'
		})
		expect(result.meta).toEqual({ total: 312, page: 2, per: 50, totalPages: 7 })
		expect(result.results[0]).toMatchObject({ granblueId: '1040001000', nameEn: 'Bahamut Sword' })
		expect(result.facets).toEqual({ element: { '1': 40, '2': 52 } })
	})

	it('treats total_pages 0 (no results) as a single empty page', async () => {
		global.fetch = mockApiResponse({
			results: [],
			meta: { total: 0, page: 1, per: 50, total_pages: 0 }
		})
		const adapter = new AdminAdapter({ baseURL: 'https://api.example.com' })
		const result = await adapter.list('weapons', { page: 1, per: 50, q: 'zzz' })
		expect(result.meta).toEqual({ total: 0, page: 1, per: 50, totalPages: 1 })
		expect(result.facets).toEqual({})
	})

	it('fills in meta and facets when the API omits them', async () => {
		global.fetch = mockApiResponse({ results: [] })
		const adapter = new AdminAdapter({ baseURL: 'https://api.example.com' })
		const result = await adapter.list('weapons', { page: 3, per: 20 })
		expect(result).toEqual({
			results: [],
			meta: { total: 0, page: 3, per: 20, totalPages: 1 },
			facets: {}
		})
	})
})

describe('fetchListPage', () => {
	it('fetches another page with the same params and caches it under its key', async () => {
		const spy = vi.spyOn(adminAdapter, 'list').mockResolvedValue({
			results: [{ granblueId: '3' }],
			meta: { total: 3, page: 2, per: 2, totalPages: 2 },
			facets: {}
		})
		const queryClient = new QueryClient()
		const params = { page: 1, per: 2, q: 'opus' }

		const response = await fetchListPage(queryClient, 'weapons', params, 2)

		expect(spy).toHaveBeenCalledWith('weapons', { page: 2, per: 2, q: 'opus' })
		expect(response.results).toEqual([{ granblueId: '3' }])
		expect(
			queryClient.getQueryData(adminKeys.list('weapons', { page: 2, per: 2, q: 'opus' }))
		).toBe(response)
		spy.mockRestore()
	})
})
