import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { flushSync, mount, unmount, tick } from 'svelte'

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/database/weapons'),
	state: {},
	data: {}
}))

// jsdom has no ResizeObserver or matchMedia; hoisted, as modules read them on import
vi.hoisted(() => {
	globalThis.ResizeObserver ??= class {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver
	window.matchMedia ??= ((query: string) => ({
		matches: true,
		media: query,
		addEventListener() {},
		removeEventListener() {}
	})) as unknown as typeof window.matchMedia
})

vi.mock('$app/state', () => ({ page: pageState }))
vi.mock('$app/navigation', () => ({ goto: vi.fn(async () => {}) }))
vi.mock('$app/environment', () => ({ browser: true, dev: false, building: false }))
// The panel needs the app's tooltip provider, and has its own tests
const panel = vi.hoisted(() => vi.fn())
vi.mock('$lib/features/database/panel/RecordPanel.svelte', () => ({ default: panel }))

// One client for the whole file, in place of the app layout's provider
const queries = vi.hoisted(() => ({ clear: () => {} }))
vi.mock('@tanstack/svelte-query', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@tanstack/svelte-query')>()
	const client = new actual.QueryClient({ defaultOptions: { queries: { retry: false } } })
	queries.clear = () => client.clear()
	return {
		...actual,
		useQueryClient: () => client,
		createQuery: ((options: never) =>
			actual.createQuery(options, () => client)) as typeof actual.createQuery
	}
})

import * as m from '$lib/paraglide/messages'
import { adminAdapter } from '$lib/api/adapters/admin.adapter'
import { seriesAdapter } from '$lib/api/adapters/series.adapter'
import type { AdminListParams, AdminWeaponRow } from '$lib/types/api/admin'
import type { WeaponSeries } from '$lib/types/api/weaponSeries'
import ResourceTable from './ResourceTable.svelte'

const row: AdminWeaponRow = {
	id: 'w1',
	granblueId: '1040001000',
	nameEn: 'Cosmic Sword',
	nameJp: 'コスモスソード',
	element: 3,
	rarity: 3,
	proficiency: 1,
	seriesId: 's1',
	seriesSlug: 'cosmos',
	seriesNameEn: 'Cosmos',
	seriesNameJp: 'コスモス',
	releaseDate: '2016-03-10',
	updatedAt: '2026-10-30T12:00:00Z',
	flb: true,
	ulb: true,
	transcendence: false,
	latestDate: '2016-03-10'
}

const list = vi.spyOn(adminAdapter, 'list')
const seriesList = vi.spyOn(seriesAdapter, 'getWeaponSeriesList')

let component: ReturnType<typeof mount> | undefined

async function render() {
	component = mount(ResourceTable, { target: document.body, props: { resource: 'weapons' } })
	// Let the queries resolve and render
	for (let i = 0; i < 5; i++) {
		await tick()
		await new Promise((resolve) => setTimeout(resolve, 0))
	}
	flushSync()
}

beforeEach(() => {
	localStorage.clear()
	panel.mockClear()
	list.mockReset().mockResolvedValue({
		results: [row],
		meta: { total: 1, page: 1, per: 25, totalPages: 1 },
		facets: { element: { '3': 1 } }
	})
	seriesList
		.mockReset()
		.mockResolvedValue([
			{ id: 's1', slug: 'cosmos', order: 1, name: { en: 'Cosmos', ja: 'コスモス' } }
		] as WeaponSeries[])
})

afterEach(() => {
	if (component) unmount(component)
	component = undefined
	queries.clear()
	document.body.innerHTML = ''
})

describe('ResourceTable', () => {
	it("renders the weapons list from the resource's definition", async () => {
		await render()

		expect(document.querySelector('table')?.getAttribute('aria-label')).toBe(m.db_weapons_label())
		// Default-hidden columns stay out
		const headers = [...document.querySelectorAll('thead th')]
		const text = (th: Element) =>
			(th.querySelector('button > span:first-child') ?? th).textContent?.trim()
		expect(headers.map(text)).toEqual([
			'',
			'Name',
			'Rarity',
			'Element',
			'Proficiency',
			'Uncap',
			'Series',
			'Release date',
			'Last updated'
		])
		// Newest first (then by name); the thumbnail stays put while scrolling
		expect(headers.map((th) => th.getAttribute('aria-sort'))[8]).toBe('descending')
		expect(headers[0]?.classList.contains('pinned')).toBe(true)

		const link = document.querySelector<HTMLAnchorElement>('tbody a.row-link')
		expect(link?.getAttribute('href')).toBe('/database/weapons/1040001000')
		expect(link?.textContent).toContain('Cosmic Sword')
		// The uncap field's component cell
		expect(document.querySelector('tbody .uncap-cell')).not.toBeNull()
		expect(document.querySelector<HTMLInputElement>('input[type="search"]')?.placeholder).toContain(
			m.collection_entity_weapons()
		)
	})

	it('asks the admin API for the visible fields, facets and default sort', async () => {
		await render()

		expect(list).toHaveBeenCalled()
		const [resource, params] = list.mock.calls.at(-1)! as [string, AdminListParams]
		expect(resource).toBe('weapons')
		expect(params.sort).toBe('-latest_date,name_en')
		expect(params.facets).toEqual(['element', 'rarity', 'proficiency', 'series'])
		expect(params.fields).toEqual(
			expect.arrayContaining(['granblue_id', 'element', 'flb', 'series_name_en'])
		)
		expect(params.fields).not.toContain('flb_date')
	})

	it('mounts the record panel for the resource', async () => {
		await render()
		expect(panel).toHaveBeenCalledTimes(1)
		expect(panel.mock.calls[0]![1]).toMatchObject({ resource: 'weapons' })
	})

	it("loads the series filter's options", async () => {
		await render()
		expect(seriesList).toHaveBeenCalledTimes(1)
	})
})
