import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/database/events/e'),
	params: { resource: 'events', id: 'e' } as Record<string, string>,
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
			actual.createQuery(options, () => client)) as typeof actual.createQuery,
		// The staff picks' mutations
		createMutation: ((options: never) =>
			actual.createMutation(options, () => client)) as typeof actual.createMutation
	}
})

import { featuredPartyAdapter } from '$lib/api/adapters/featuredParty.adapter'
import ResourceDetail from '$lib/features/database/schema/ResourceDetail.svelte'
import { eventsResource } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'
import baseline from './__fixtures__/detail-baseline.json'
import type { GameEvent } from '$lib/types/api/event'

/** Visible text, one line per text node, as the baseline was captured */
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

function render(record: GameEvent, props: { role?: number; tab?: string } = {}) {
	target = document.createElement('div')
	document.body.appendChild(target)
	mounted = mount(ResourceDetail, {
		target,
		props: {
			def: eventsResource,
			granblueId: record.id,
			initialData: record,
			role: props.role ?? 6,
			tab: props.tab ?? null,
			onTabChange: () => {}
		}
	})
	flushSync()
}

const tabLabels = () =>
	[...target.querySelectorAll('[role="radio"], button')].map((b) => b.textContent?.trim())

afterEach(() => {
	vi.restoreAllMocks()
	if (mounted) unmount(mounted)
	mounted = null
	target?.remove()
	queries.clear()
})

/**
 * The curator's read-only page, as the generated detail draws it on purpose:
 * a blank Japanese name reads as a dash, and the boss element as its
 * label's icon (no text)
 */
function expectedInfo(name: keyof typeof baseline): string[] {
	const info = [...baseline[name].info]
	const ja = info.indexOf('Name (Japanese)')
	if (info[ja + 1] === 'Kind') info.splice(ja + 1, 0, '—')
	const element = info.indexOf('Boss element')
	if (info[element + 1] !== '—') info.splice(element + 1, 1)
	return info
}

describe('events detail: the Info tab matches the curator page', () => {
	for (const name of Object.keys(baseline) as Array<keyof typeof baseline>) {
		it(name, () => {
			render(detailRecords[name])
			expect(lines(target.querySelector('.details'))).toEqual(expectedInfo(name))
		})
	}
})

describe('events detail: curators and editors', () => {
	// Ids of their own: the record query caches by id
	const ended = { ...detailRecords.guildWar, id: 'ended', endsAt: '2020-01-01T00:00:00.000Z' }
	const running = { ...detailRecords.guildWar, id: 'running', endsAt: '2099-01-01T00:00:00.000Z' }
	const endedHint = 'This event has ended. Only editors can change its staff picks.'

	beforeEach(() => {
		vi.spyOn(featuredPartyAdapter, 'listFeaturedParties').mockResolvedValue([])
	})

	it('gives curators the Staff picks tab, and only editors the Banner', () => {
		render(running, { role: 6 })
		expect(tabLabels()).toEqual(expect.arrayContaining(['Info', 'Staff picks']))
		expect(tabLabels()).not.toContain('Banner')
		unmount(mounted!)
		mounted = null
		render(running, { role: 7 })
		expect(tabLabels()).toEqual(expect.arrayContaining(['Info', 'Staff picks', 'Banner']))
	})

	it('lets curators manage the picks of a running event only', async () => {
		render(running, { role: 6, tab: 'picks' })
		await vi.waitFor(() => expect(target.textContent).toContain('No staff picks'))
		expect(target.textContent).not.toContain(endedHint)
		unmount(mounted!)
		mounted = null
		render(ended, { role: 6, tab: 'picks' })
		await vi.waitFor(() => expect(target.textContent).toContain(endedHint))
	})

	it('lets editors manage the picks of an ended event', async () => {
		render(ended, { role: 7, tab: 'picks' })
		await vi.waitFor(() => expect(target.textContent).toContain('No staff picks'))
		expect(target.textContent).not.toContain(endedHint)
	})

	it('falls back to Info for a curator asking for the Banner', () => {
		render(running, { role: 6, tab: 'images' })
		expect(target.querySelector('.details')).not.toBeNull()
		expect(target.textContent).toContain('Starts (JST)')
	})
})
