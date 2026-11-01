import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/database/raids/wilnas'),
	params: { resource: 'raids', id: 'wilnas' } as Record<string, string>,
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
			actual.createQuery(options, () => client)) as typeof actual.createQuery
	}
})

import ResourceDetail from '$lib/features/database/schema/ResourceDetail.svelte'
import type { AnyResourceDef } from '$lib/features/database/schema/registry'
import { raidGroupsResource } from '$lib/features/database/raid-groups/resource'
import { detailRecords as groups } from '$lib/features/database/raid-groups/__fixtures__/detailRecords'
import groupBaseline from '$lib/features/database/raid-groups/__fixtures__/detail-baseline.json'
import { raidsResource } from './resource'
import { detailRecords as raids } from './__fixtures__/detailRecords'
import raidBaseline from './__fixtures__/detail-baseline.json'

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

function render(def: AnyResourceDef, id: string, record: unknown, role = 7) {
	target = document.createElement('div')
	document.body.appendChild(target)
	mounted = mount(ResourceDetail, {
		target,
		props: { def, granblueId: id, initialData: record, role, tab: null, onTabChange: () => {} }
	})
	flushSync()
}

afterEach(() => {
	if (mounted) unmount(mounted)
	mounted = null
	target?.remove()
	queries.clear()
})

/**
 * The raid baseline as the generated detail draws it on purpose: player
 * counts read as their select option ("6 players"), the element as its
 * label's icon (no text), and the release date the forms edit shows too
 */
function expectedRaidInfo(name: keyof typeof raidBaseline): string[] {
	const info = [...raidBaseline[name].info]
	const players = info.indexOf('Players')
	if (info[players + 1] !== 'Solo') info[players + 1] = `${info[players + 1]} players`
	info.splice(info.indexOf('Element') + 1, 1)
	const record = raids[name]
	info.splice(info.indexOf('Classification'), 0, 'Release date', record.releasedAt ?? '—')
	return info
}

describe('raids detail: the Info tab matches the hand-written detail', () => {
	for (const name of Object.keys(raidBaseline) as Array<keyof typeof raidBaseline>) {
		it(name, () => {
			const record = raids[name]
			render(raidsResource, record.slug, record)
			expect(lines(target.querySelector('.details'))).toEqual(expectedRaidInfo(name))
		})
	}

	it("draws the element's label and links the group", () => {
		render(raidsResource, raids.full.slug, raids.full)
		const items = [...target.querySelectorAll('.detail-item')]
		const item = (label: string) =>
			items.find((i) => i.querySelector('.label')?.textContent === label)
		expect(item('Element')?.querySelector('img')).not.toBeNull()
		expect(target.querySelector('a[href*="/database/raid-groups/g-six-dragons"]')).not.toBeNull()
	})

	it('has an Images tab for everyone', () => {
		render(raidsResource, raids.full.slug, raids.full, 1)
		const labels = [...target.querySelectorAll('[role="radio"], button')].map((b) =>
			b.textContent?.trim()
		)
		expect(labels).toEqual(expect.arrayContaining(['Info', 'Images']))
	})
})

describe('raid groups detail: the Info tab matches the hand-written detail', () => {
	for (const name of Object.keys(groupBaseline) as Array<keyof typeof groupBaseline>) {
		it(name, () => {
			const record = groups[name]
			render(raidGroupsResource, record.id, record)
			expect(lines(target.querySelector('.details'))).toEqual(groupBaseline[name].info)
		})
	}

	it('links each member raid to its page', () => {
		render(raidGroupsResource, groups.full.id, groups.full)
		expect(target.querySelector('a[href*="/database/raids/wilnas"]')).not.toBeNull()
		expect(target.querySelector('a[href*="/database/raids/wamdus"]')).not.toBeNull()
	})
})
