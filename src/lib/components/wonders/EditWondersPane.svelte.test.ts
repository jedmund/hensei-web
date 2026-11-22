import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'

// jsdom has no ResizeObserver; the level Slider (bits-ui) reads it on mount
vi.hoisted(() => {
	globalThis.ResizeObserver ??= class {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver
})

// One client for the file, in place of the app layout's provider
const queries = vi.hoisted(() => ({
	client: null as unknown as import('@tanstack/svelte-query').QueryClient
}))
vi.mock('@tanstack/svelte-query', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@tanstack/svelte-query')>()
	const client = new actual.QueryClient({ defaultOptions: { queries: { retry: false } } })
	queries.client = client
	return {
		...actual,
		useQueryClient: () => client,
		createQuery: ((options: never) =>
			actual.createQuery(options, () => client)) as typeof actual.createQuery
	}
})

const sidebarMock = vi.hoisted(() => ({
	setAction: vi.fn(),
	setActionForPane: vi.fn(),
	paneStack: { updatePaneById: vi.fn() }
}))
vi.mock('$lib/stores/sidebar.svelte', () => ({ sidebar: sidebarMock }))
vi.mock('$lib/stores/stackedPanes', () => ({ finishStackedPane: vi.fn() }))

import EditWondersPane from './EditWondersPane.svelte'
import { wonderKeys } from '$lib/api/queries/wonder.queries'
import {
	catalogue,
	fireSeal,
	owned,
	shield,
	symbolum,
	waterSeal
} from '$lib/features/wonders/__fixtures__/catalogue'
import type { Party } from '$lib/types/api/party'
import type { PartyWonderInput } from '$lib/types/api/wonder'

let mounted: ReturnType<typeof mount> | null = null

afterEach(() => {
	if (mounted) unmount(mounted)
	mounted = null
	document.body.innerHTML = ''
	queries.client.clear()
	vi.clearAllMocks()
})

function party(overrides: Partial<Party> = {}): Party {
	return {
		id: 'party-1',
		shortcode: 'abc123',
		element: 2,
		weapons: [],
		characters: [],
		summons: [],
		wonders: [],
		...overrides
	} as Party
}

function render(p: Party) {
	queries.client.setQueryData(wonderKeys.catalogue(), catalogue)
	const onSave = vi.fn<(wonders: PartyWonderInput[]) => void>()
	mounted = mount(EditWondersPane, { target: document.body, props: { party: p, onSave } })
	flushSync()
	return onSave
}

/** The row for a Wonder, found by its name. */
function row(name: string): HTMLElement {
	const found = [...document.querySelectorAll<HTMLElement>('.wonder-row')].find((el) =>
		el.querySelector('.name')?.textContent?.includes(name)
	)
	if (!found) throw new Error(`No row for ${name}`)
	return found
}

function save() {
	const calls = sidebarMock.setAction.mock.calls
	const handler = calls[calls.length - 1]?.[0] as (() => void) | undefined
	if (!handler) throw new Error('Save is disabled')
	handler()
}

describe('EditWondersPane', () => {
	it('offers battle-relevant Wonders of every element, and no story Wonders', () => {
		render(party())
		const names = [...document.querySelectorAll('.wonder-row .name')].map((el) => el.textContent)
		expect(names).toContain('Seal of the Blazing Bodhisattva')
		expect(names).toContain('Seal of the Underworld Emperor')
		expect(names).not.toContain('Morning Calm of Tiamat')
	})

	it('leaves Seals out on Unite and Fight teams, and keeps them when saving', () => {
		const onSave = render(
			party({
				raid: { group: { contentMode: 'unite_and_fight' } } as Party['raid'],
				wonders: [owned(waterSeal, { level: 20, evolution: 3 })]
			})
		)
		expect(document.body.textContent).not.toContain('Seal of the')

		row('Shield of Eternal Splendor').querySelector<HTMLElement>('[role="switch"]')!.click()
		flushSync()
		save()

		expect(onSave).toHaveBeenCalledWith([
			{ wonderId: waterSeal.id, level: 20, evolution: 3, possession: null },
			{ wonderId: shield.id, level: null, evolution: null, possession: null }
		])
	})

	it('caps the level when the uncap goes down', () => {
		const onSave = render(party({ wonders: [owned(fireSeal, { level: 20, evolution: 3 })] }))
		const seal = row('Seal of the Blazing Bodhisattva')
		expect(seal.textContent).toContain('Lvl 20')

		// Tapping the third (filled) star empties it: uncap 3 -> 2
		seal.querySelectorAll<HTMLButtonElement>('button.star-button')[2]!.click()
		flushSync()
		expect(seal.textContent).toContain('Lvl 18')

		save()
		expect(onSave).toHaveBeenCalledWith([
			{ wonderId: fireSeal.id, level: 18, evolution: 2, possession: null }
		])
	})

	it("takes Symbolum's recruited count and shows its bonus", () => {
		const onSave = render(party())
		const symbolumRow = row('Symbolum Amicitiae')
		symbolumRow.querySelector<HTMLElement>('[role="switch"]')!.click()
		flushSync()

		const input = symbolumRow.querySelector<HTMLInputElement>('input[type="number"]')!
		input.value = '900'
		input.dispatchEvent(new Event('input', { bubbles: true }))
		flushSync()
		expect(symbolumRow.textContent).toContain('+4%')

		save()
		expect(onSave).toHaveBeenCalledWith([
			{ wonderId: symbolum.id, level: null, evolution: null, possession: 900 }
		])
	})

	it('keeps Save disabled until something changes', () => {
		render(party({ wonders: [owned(shield)] }))
		const calls = sidebarMock.setAction.mock.calls
		expect(calls[calls.length - 1]?.[0]).toBeUndefined()
	})
})
