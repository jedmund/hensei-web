import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/database/weapon-series/dark-opus/edit'),
	params: { resource: 'weapon-series', id: 'dark-opus' } as Record<string, string>,
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
vi.mock('$app/navigation', () => ({ beforeNavigate: vi.fn(), goto: vi.fn(async () => {}) }))
vi.mock('$app/environment', () => ({ browser: true, dev: false, building: false }))

// One client for the whole file, in place of the app layout's provider
const queries = vi.hoisted(() => ({
	clear: () => {},
	seed: (() => {}) as (key: unknown[], data: unknown) => void
}))
vi.mock('@tanstack/svelte-query', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@tanstack/svelte-query')>()
	const client = new actual.QueryClient({
		defaultOptions: { queries: { retry: false, staleTime: Infinity } }
	})
	queries.clear = () => client.clear()
	queries.seed = (key, data) => client.setQueryData(key, data)
	return {
		...actual,
		useQueryClient: () => client,
		createQuery: ((options: never) =>
			actual.createQuery(options, () => client)) as typeof actual.createQuery,
		// The variants input's dialog
		createMutation: ((options: never) =>
			actual.createMutation(options, () => client)) as typeof actual.createMutation
	}
})

import { detailRecords } from '$lib/features/database/weapon-series/__fixtures__/detailRecords'
import ResourceEditScreen from '$lib/features/database/schema/ResourceEditScreen.svelte'

let mounted: ReturnType<typeof mount> | null = null
let target: HTMLElement

function render(record: (typeof detailRecords)[keyof typeof detailRecords]) {
	pageState.params.id = record.slug
	queries.seed(['weaponSeries', record.slug], record)
	target = document.createElement('div')
	document.body.appendChild(target)
	mounted = mount(ResourceEditScreen, {
		target,
		props: { data: { record, role: 7, resource: 'weapon-series' } }
	})
	flushSync()
}

const text = (el: Element) => el.textContent?.trim() ?? ''
const slotItems = () =>
	[...target.querySelectorAll('.detail-item')].filter((item) =>
		/^Key Slot \d$/.test(text(item.querySelector('.label')!))
	)
/** Each slot's label and its filled stars */
const slotInputs = () =>
	slotItems().map((item) => [
		text(item.querySelector('.label')!),
		item.querySelectorAll('.star:not(.empty)').length
	])

afterEach(() => {
	if (mounted) unmount(mounted)
	mounted = null
	target?.remove()
	queries.clear()
})

// GBF-209: editors set the uncap each key slot needs
describe('weapon series edit: key slot unlocks', () => {
	it("shows each key slot's level as uncap stars", () => {
		render(detailRecords.keyed)
		expect(target.textContent).toContain('needs before a key can go in it')
		expect(slotInputs()).toEqual([
			['Key Slot 1', 4],
			['Key Slot 2', 5]
		])
	})

	it('sets a slot by clicking its stars, down to none', () => {
		render(detailRecords.keyed)
		const stars = () => slotItems()[0]!.querySelectorAll<HTMLButtonElement>('.star button')
		stars()[1]!.click()
		flushSync()
		expect(slotInputs()[0]).toEqual(['Key Slot 1', 1])
		stars()[0]!.click()
		flushSync()
		expect(slotInputs()[0]).toEqual(['Key Slot 1', 0])
		stars()[4]!.click()
		flushSync()
		expect(slotInputs()).toEqual([
			['Key Slot 1', 5],
			['Key Slot 2', 5]
		])
	})

	it('has no slot inputs for a series without keys', () => {
		render(detailRecords.plain)
		expect(slotInputs()).toEqual([])
	})
})
