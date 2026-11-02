/**
 * The generated bullet detail must draw what the hand-written detail page
 * drew (detail-baseline.json), with the image moved into the header.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/database/bullets/10101'),
	params: { resource: 'bullets', id: '10101' } as Record<string, string>,
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
import { bulletsResource } from './resource'
import { detailRecords as bullets } from './__fixtures__/detailRecords'
import baseline from './__fixtures__/detail-baseline.json'

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

function render(record: { granblueId: string }) {
	target = document.createElement('div')
	document.body.appendChild(target)
	mounted = mount(ResourceDetail, {
		target,
		props: {
			def: bulletsResource,
			id: record.granblueId,
			initialData: record,
			role: 7,
			tab: null,
			onTabChange: () => {}
		}
	})
	flushSync()
}

afterEach(() => {
	vi.restoreAllMocks()
	if (mounted) unmount(mounted)
	mounted = null
	target?.remove()
	queries.clear()
})

describe('bullets detail: the Info tab matches the hand-written page', () => {
	for (const name of Object.keys(baseline) as Array<keyof typeof baseline>) {
		it(name, () => {
			render(bullets[name])
			expect(lines(target.querySelector('.details'))).toEqual(baseline[name].info)
		})
	}

	it('shows the bullet image in the header, and no tabs', () => {
		render(bullets.neptune)
		const sources = [...target.querySelectorAll('img')].map((i) => i.getAttribute('src') ?? '')
		expect(sources.some((src) => src.includes('bullets/square/40801'))).toBe(true)
		expect(target.querySelector('[role="radio"]')).toBeNull()
	})
})
