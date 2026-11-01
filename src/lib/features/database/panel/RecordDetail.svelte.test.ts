import { describe, it, expect, afterEach, vi } from 'vitest'
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
import { detailRecords } from '$lib/features/database/characters/__fixtures__/detailRecords'
import RecordDetail from './RecordDetail.svelte'

let mounted: ReturnType<typeof mount> | null = null
let target: HTMLElement

async function render(id: string) {
	target = document.createElement('div')
	document.body.appendChild(target)
	mounted = mount(RecordDetail, {
		target,
		props: { resource: 'characters', id, role: 7, tab: 'info', onTabChange: () => {} }
	})
	flushSync()
	await vi.waitFor(() => expect(target.querySelector('.details')).not.toBeNull())
}

afterEach(() => {
	vi.restoreAllMocks()
	if (mounted) unmount(mounted)
	mounted = null
	target?.remove()
	queries.clear()
})

describe('RecordDetail: characters', () => {
	it('draws a base character from its definition', async () => {
		const get = vi
			.spyOn(characterAdapter, 'getCharacter')
			.mockResolvedValue(detailRecords.transcended as Character)
		vi.spyOn(characterAdapter, 'getRelatedCharacters').mockResolvedValue([])
		await render('3040169000')
		expect(get).toHaveBeenCalledWith('3040169000', undefined)
		expect(target.textContent).toContain('Gender Variants')
	})

	it('keeps the style shift detail for a `-style` id', async () => {
		const get = vi
			.spyOn(characterAdapter, 'getCharacter')
			.mockResolvedValue(detailRecords.style as Character)
		vi.spyOn(characterAdapter, 'getRelatedCharacters').mockResolvedValue([])
		await render('3040088000-style')
		expect(get).toHaveBeenCalledWith('3040088000', { styleSwap: true })
	})
})
