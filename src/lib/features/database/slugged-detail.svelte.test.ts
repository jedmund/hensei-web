/**
 * The generated details of the slug-keyed resources (weapon series,
 * character series, awakenings). The series' Info tabs must match the text
 * the hand-written series pages drew (each resource's detail-baseline.json),
 * with two deliberate differences: a weapon series with keys shows its key
 * slots, and a blank Japanese name shows a dash rather than nothing.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'

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

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/database'), params: {}, state: {}, data: {} }
}))
vi.mock('$app/navigation', () => ({ goto: vi.fn(async () => {}) }))
vi.mock('$app/environment', () => ({ browser: true, dev: false, building: false }))

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

import ResourceDetail from '$lib/features/database/schema/ResourceDetail.svelte'
import type { AnyResourceDef } from '$lib/features/database/schema/registry'
import { awakeningsResource } from './awakenings/resource'
import { characterSeriesResource } from './character-series/resource'
import { weaponSeriesResource } from './weapon-series/resource'
import { detailRecords as characterSeries } from './character-series/__fixtures__/detailRecords'
import characterBaseline from './character-series/__fixtures__/detail-baseline.json'
import { detailRecords as weaponSeries } from './weapon-series/__fixtures__/detailRecords'
import weaponBaseline from './weapon-series/__fixtures__/detail-baseline.json'

/** Visible text, one line per text node, as the baselines were captured */
function lines(el: Element | null): string[] {
	if (!el) return []
	const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
	const out: string[] = []
	while (walker.nextNode()) {
		const text = walker.currentNode.textContent?.replace(/\s+/g, ' ').trim()
		if (text) out.push(text)
	}
	return out
}

let mounted: ReturnType<typeof mount> | null = null
let target: HTMLElement

function render(def: AnyResourceDef, record: { slug: string }) {
	target = document.createElement('div')
	document.body.appendChild(target)
	mounted = mount(ResourceDetail, {
		target,
		props: { def, id: record.slug, initialData: record, role: 7, tab: null, onTabChange: () => {} }
	})
	flushSync()
}

afterEach(() => {
	if (mounted) unmount(mounted)
	mounted = null
	target?.remove()
	queries.clear()
})

/** The baseline with the deliberate differences applied */
function expected(info: string[], record: { name: { ja: string }; numWeaponKeys?: number | null }) {
	const out = [...info]
	if (!record.name.ja) out.splice(out.indexOf('Name (JA)') + 1, 0, '—')
	const keys = out.indexOf('Has Weapon Keys')
	if (keys >= 0 && out[keys + 1] === 'Yes') {
		out.splice(keys + 2, 0, 'Weapon Key Slots', String(record.numWeaponKeys ?? '—'))
	}
	return out
}

describe('weapon series detail: the Info tab matches the hand-written page', () => {
	for (const name of Object.keys(weaponBaseline) as Array<keyof typeof weaponBaseline>) {
		it(name, () => {
			const record = weaponSeries[name]
			render(weaponSeriesResource, record)
			expect(lines(target.querySelector('.details'))).toEqual(
				expected(weaponBaseline[name].info, record)
			)
		})
	}

	it('has no image and no tabs, as the page had none', () => {
		render(weaponSeriesResource, weaponSeries.keyed)
		expect(target.querySelector('.image img')).toBeNull()
		expect(target.querySelector('[role="radio"]')).toBeNull()
		expect(target.querySelector('h2')?.textContent).toBe('Dark Opus')
	})
})

describe('character series detail: the Info tab matches the hand-written page', () => {
	for (const name of Object.keys(characterBaseline) as Array<keyof typeof characterBaseline>) {
		it(name, () => {
			const record = characterSeries[name]
			render(characterSeriesResource, record)
			expect(lines(target.querySelector('.details'))).toEqual(
				expected(characterBaseline[name].info, record)
			)
		})
	}
})

describe('awakening detail', () => {
	it('shows the icon, names, slug, type and order', () => {
		const record = {
			id: 'a-multi',
			name: { en: 'Multiattack', ja: '連撃' },
			slug: 'character-multi',
			objectType: 'Character',
			order: 3
		}
		render(awakeningsResource, record)
		expect(lines(target.querySelector('.details'))).toEqual([
			'Basic Info',
			'Image',
			'Name (EN)',
			'Multiattack',
			'Name (JA)',
			'連撃',
			'Slug',
			'character-multi',
			'Type',
			'Character',
			'Order',
			'3'
		])
		expect(target.querySelector('.details img')?.getAttribute('src')).toMatch(
			/icons\/awakening\/character-multi\.jpg$/
		)
	})
})
