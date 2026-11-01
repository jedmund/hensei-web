import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/database/summons/2040034000'),
	params: { resource: 'summons', id: '2040034000' } as Record<string, string>,
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

import type { Summon } from '$lib/api/adapters/summon.adapter'
import ResourceDetail from '$lib/features/database/schema/ResourceDetail.svelte'
import { summonsResource } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'
import baseline from './__fixtures__/detail-baseline.json'

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

function render(name: keyof typeof detailRecords, props: { role?: number; tab?: string } = {}) {
	target = document.createElement('div')
	document.body.appendChild(target)
	const record = detailRecords[name] as Summon
	mounted = mount(ResourceDetail, {
		target,
		props: {
			def: summonsResource,
			granblueId: record.granblueId,
			initialData: record,
			role: props.role ?? 7,
			tab: props.tab ?? null,
			onTabChange: () => {}
		}
	})
	flushSync()
}

/**
 * The baseline without the Call Effect and Aura Effect block, dropped on
 * purpose: it read fields the API never sends, so it only ever said there was
 * no information (the Auras tab shows the real auras)
 */
function expectedInfo(name: keyof typeof baseline): string[] {
	const info = baseline[name].info
	return info.slice(0, info.indexOf('Call Effect'))
}

afterEach(() => {
	vi.restoreAllMocks()
	if (mounted) unmount(mounted)
	mounted = null
	target?.remove()
	queries.clear()
})

describe('summons detail: the Info tab matches the hand-written detail', () => {
	for (const name of Object.keys(baseline) as Array<keyof typeof baseline>) {
		it(name, () => {
			render(name)
			expect(lines(target.querySelector('.details'))).toEqual(expectedInfo(name))
		})
	}

	it('draws the uncap stars, the element label and the link buttons', () => {
		render('transcended')
		const items = [...target.querySelectorAll('.detail-item')]
		const item = (label: string) =>
			items.find((i) => i.querySelector('.label')?.textContent === label)
		expect(item('Uncap')?.querySelector('.star, svg, img')).not.toBeNull()
		expect(item('Element')?.querySelector('img')).not.toBeNull()
		expect(target.querySelector('a[href*="gbf.wiki"]')).not.toBeNull()
	})
})

describe('summons detail: tabs', () => {
	const tabLabels = () =>
		[...target.querySelectorAll('[role="radio"], button')].map((b) => b.textContent?.trim())

	it('has Auras once the summon has some, Images, and Raw Data only for editors', () => {
		render('transcended')
		expect(tabLabels()).toEqual(expect.arrayContaining(['Info', 'Auras', 'Images', 'Raw Data']))
		unmount(mounted!)
		mounted = null
		render('flb', { role: 1 })
		expect(tabLabels()).toEqual(expect.arrayContaining(['Info', 'Images']))
		expect(tabLabels()).not.toContain('Auras')
		expect(tabLabels()).not.toContain('Raw Data')
	})

	it('lists the main and sub auras', () => {
		render('transcended', { tab: 'skills' })
		expect(target.querySelector('.details')).toBeNull()
		expect(target.textContent).toContain('120%')
		expect(target.textContent).toContain('Sub Aura')
	})

	it('draws every transformation of a transcended summon', () => {
		render('transcended', { tab: 'images' })
		const sources = [...target.querySelectorAll('img')].map((i) => i.getAttribute('src') ?? '')
		expect(sources.some((src) => src.includes('2040034000'))).toBe(true)
		expect(sources.some((src) => src.includes('2040034000_02'))).toBe(true)
	})
})
