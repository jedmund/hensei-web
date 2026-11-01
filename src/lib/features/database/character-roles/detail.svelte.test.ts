import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/database/character-roles/8bbd9870-a997-4ece-adf2-e845b39da9f7'),
	params: { resource: 'character-roles', id: '8bbd9870-a997-4ece-adf2-e845b39da9f7' } as Record<
		string,
		string
	>,
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
import { toRoleRecord, type RoleRecord } from './record'
import { characterRolesResource as def } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'
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

function render(record: RoleRecord) {
	target = document.createElement('div')
	document.body.appendChild(target)
	mounted = mount(ResourceDetail, {
		target,
		props: {
			def,
			id: def.record!.routeId(record),
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

type Baseline = Record<
	string,
	{ id: string; info: string[]; header: string[]; icon: string | null }
>

describe('character roles detail: matches the hand-written page', () => {
	for (const [name, expected] of Object.entries(baseline as Baseline)) {
		const record = toRoleRecord(detailRecords[name as keyof typeof detailRecords])

		it(`${name}: the Details section`, () => {
			render(record)
			expect(lines(target.querySelector('.details'))).toEqual(expected.info)
		})

		it(`${name}: the name and icon in the header`, () => {
			render(record)
			const header = target.querySelector('header')
			expect(lines(header)).toEqual(expect.arrayContaining(expected.header))
			const src = header?.querySelector('img')?.getAttribute('src') ?? null
			if (expected.icon) expect(src).toContain(expected.icon.replace(/^\//, ''))
			else expect(src).toBeNull()
		})
	}
})
