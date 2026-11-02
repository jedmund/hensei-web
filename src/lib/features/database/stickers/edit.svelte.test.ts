/**
 * The stickers edit screen: the fixed slug, the image inputs, and the
 * generated Delete (save.destroy), disabled once a sticker has been given.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushSync, mount, tick, unmount } from 'svelte'

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/database/stickers/stamp-9/edit'),
	params: { resource: 'stickers', id: 'stamp-9' } as Record<string, string>,
	state: {},
	data: {}
}))

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

const navigation = vi.hoisted(() => ({ goto: vi.fn(async () => {}) }))
vi.mock('$app/state', () => ({ page: pageState }))
vi.mock('$app/navigation', () => ({ beforeNavigate: vi.fn(), goto: navigation.goto }))
vi.mock('$app/environment', () => ({ browser: true, dev: false, building: false }))

const adapter = vi.hoisted(() => ({ deleteSticker: vi.fn(async () => {}) }))
vi.mock('$lib/api/adapters/sticker.adapter', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/api/adapters/sticker.adapter')>()
	actual.stickerAdapter.deleteSticker = adapter.deleteSticker
	return actual
})

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
			actual.createQuery(options, () => client)) as typeof actual.createQuery
	}
})

import ResourceEditScreen from '$lib/features/database/schema/ResourceEditScreen.svelte'
import type { Sticker } from '$lib/types/api/sticker'

const thanks: Sticker = {
	id: '572fd30c-83f0-4264-9542-cc1e8892d16e',
	slug: 'stamp-9',
	meaning: { en: 'Thanks!', ja: 'ありがとう' },
	imageUrl: 'icons/stickers/stamp9.png?v=1',
	imageUrlJa: null,
	position: 0,
	active: true,
	deletable: false
}

let mounted: ReturnType<typeof mount> | null = null
let target: HTMLElement

function render(overrides: Partial<Sticker> = {}) {
	queries.seed(['stickers', 'library'], [])
	target = document.createElement('div')
	document.body.appendChild(target)
	mounted = mount(ResourceEditScreen, {
		target,
		props: { data: { record: { ...thanks, ...overrides }, role: 7, resource: 'stickers' } }
	})
	flushSync()
}

const text = (el: Element | null) => el?.textContent?.trim() ?? ''
const deleteButton = () =>
	[...target.querySelectorAll<HTMLButtonElement>('.delete-row button')].find(
		(b) => text(b) === 'Delete'
	)!

afterEach(() => {
	if (mounted) unmount(mounted)
	mounted = null
	target?.remove()
	queries.clear()
	vi.clearAllMocks()
})

describe('stickers edit screen', () => {
	it('shows the slug without an input, and both images', () => {
		render()
		const slug = [...target.querySelectorAll('.detail-item')].find(
			(i) => text(i.querySelector('.label')) === 'Slug'
		)!
		expect(slug.querySelector('input')).toBeNull()
		expect(slug.textContent).toContain('stamp-9')
		expect(target.textContent).toContain('English')
		expect(target.textContent).toContain('Japanese')
		// No Japanese image: nothing to remove
		expect(target.textContent).not.toContain('Remove Japanese image')
	})

	it('disables Delete with the reason once the sticker has been given', () => {
		render()
		expect(deleteButton().disabled).toBe(true)
		expect(text(target.querySelector('.delete-row .reason'))).toBe(
			"Stickers that have been given can't be deleted."
		)
	})

	it('deletes after confirming, then opens the list', async () => {
		render({ deletable: true })
		expect(deleteButton().disabled).toBe(false)
		deleteButton().click()
		flushSync()
		const confirm = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
			(b) => text(b) === 'Yes, delete'
		)!
		confirm.click()
		// The delete awaits the mutation and the cache invalidations first; CI runners are slow
		await vi.waitFor(() => expect(navigation.goto).toHaveBeenCalledWith('/database/stickers'), {
			timeout: 5000
		})
		expect(adapter.deleteSticker).toHaveBeenCalledWith(thanks.id)
		await tick()
	})
})
