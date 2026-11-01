import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/database/characters/3040169000'),
	params: { resource: 'characters', id: '3040169000' } as Record<string, string>,
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

import { characterAdapter, type Character } from '$lib/api/adapters/character.adapter'
import ResourceDetail from '$lib/features/database/schema/ResourceDetail.svelte'
import { charactersResource } from './resource'
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
	const record = detailRecords[name] as Character
	mounted = mount(ResourceDetail, {
		target,
		props: {
			def: charactersResource,
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
 * The baseline as the generated detail draws it on purpose: the released
 * transcendence stage reads as its select option ("Stage 5")
 */
function expectedInfo(name: keyof typeof baseline): string[] {
	const info = [...baseline[name].info]
	const stage = info.indexOf('Maximum Transcendence Stage')
	if (stage >= 0) info[stage + 1] = `Stage ${info[stage + 1]}`
	return info
}

beforeEach(() => {
	vi.spyOn(characterAdapter, 'getRelatedCharacters').mockResolvedValue([])
})

afterEach(() => {
	vi.restoreAllMocks()
	if (mounted) unmount(mounted)
	mounted = null
	target?.remove()
	queries.clear()
})

describe('characters detail: the Info tab matches the hand-written detail', () => {
	for (const name of Object.keys(baseline) as Array<keyof typeof baseline>) {
		it(name, () => {
			render(name)
			expect(lines(target.querySelector('.details'))).toEqual(expectedInfo(name))
		})
	}

	it('draws the uncap stars, element and proficiency labels, and links', () => {
		render('transcended')
		const items = [...target.querySelectorAll('.detail-item')]
		const item = (label: string) =>
			items.find((i) => i.querySelector('.label')?.textContent === label)
		expect(item('Uncap Level')?.querySelector('.star, svg, img')).not.toBeNull()
		expect(item('Element')?.querySelector('img')).not.toBeNull()
		expect(item('Proficiency 1')?.querySelector('img')).not.toBeNull()
		expect(item('Proficiency 2')?.querySelector('img')).not.toBeNull()
		expect(target.querySelector('a[href*="/database/weapons/1040315900"]')).not.toBeNull()
	})

	it('links a style shift to its base character', () => {
		render('style')
		expect(target.querySelector('a[href*="/database/characters/3040088000"]')).not.toBeNull()
	})

	it('shows related units once they load', async () => {
		vi.spyOn(characterAdapter, 'getRelatedCharacters').mockResolvedValue([
			{ ...(detailRecords.style as Character), id: 'c-related' }
		])
		render('transcended')
		await vi.waitFor(() => expect(target.textContent).toContain('Related Units'))
		expect(target.querySelector('a[href*="/database/characters/3040088000/style"]')).not.toBeNull()
	})
})

describe('characters detail: tabs', () => {
	const tabLabels = () =>
		[...target.querySelectorAll('[role="radio"], button')].map((b) => b.textContent?.trim())

	it('has Skills and Images, and Raw Data only for editors', () => {
		render('transcended')
		expect(tabLabels()).toEqual(expect.arrayContaining(['Info', 'Skills', 'Images', 'Raw Data']))
		unmount(mounted!)
		mounted = null
		render('transcended', { role: 1 })
		expect(tabLabels()).not.toContain('Raw Data')
	})

	it('draws every pose of a transcended character', () => {
		render('transcended', { tab: 'images' })
		expect(target.querySelector('.details')).toBeNull()
		const sources = [...target.querySelectorAll('img')].map((i) => i.getAttribute('src') ?? '')
		expect(sources.some((src) => src.includes('3040169000_04'))).toBe(true)
	})
})
