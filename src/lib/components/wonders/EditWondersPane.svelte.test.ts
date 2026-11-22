import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount, type Component } from 'svelte'

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
			actual.createQuery(options, () => client)) as typeof actual.createQuery,
		createMutation: ((options: never) =>
			actual.createMutation(options, () => client)) as typeof actual.createMutation
	}
})

const sidebarMock = vi.hoisted(() => ({
	setAction: vi.fn(),
	setActionForPane: vi.fn(),
	setOverflowMenuForPane: vi.fn(),
	push: vi.fn(),
	pop: vi.fn(),
	close: vi.fn(),
	paneStack: { updatePaneById: vi.fn(), popTo: vi.fn() }
}))
vi.mock('$lib/stores/sidebar.svelte', () => ({ sidebar: sidebarMock }))

vi.mock('$app/stores', async () => {
	const { readable } = await import('svelte/store')
	return { page: readable({ data: {} }) }
})

vi.mock('svelte-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('$lib/api/adapters/wonder.adapter', () => ({
	wonderAdapter: {
		getCatalogue: vi.fn(),
		updatePartyWonders: vi.fn(),
		syncPartyWonders: vi.fn()
	}
}))

import EditWondersPane from './EditWondersPane.svelte'
import TooltipProviderTestHarness from './TooltipProviderTestHarness.svelte'
import { wonderAdapter } from '$lib/api/adapters/wonder.adapter'
import { wonderKeys } from '$lib/api/queries/wonder.queries'
import { partyKeys } from '$lib/api/queries/party.queries'
import {
	catalogue,
	fireSeal,
	owned,
	ringOfDeath,
	shield,
	symbolum,
	tiamat,
	waterSeal,
	zhurong
} from '$lib/features/wonders/__fixtures__/catalogue'
import type { Party } from '$lib/types/api/party'
import type { OwnedWonder, PartyWonderInput } from '$lib/types/api/wonder'
import type { PaneConfig } from '$lib/stores/paneStack.svelte'

const GRID = 'grid-pane'
const UNITE_AND_FIGHT = { group: { contentMode: 'unite_and_fight' } } as Party['raid']

let mounted: ReturnType<typeof mount>[] = []

afterEach(() => {
	for (const component of mounted) unmount(component)
	mounted = []
	document.body.innerHTML = ''
	queries.client.clear()
	vi.clearAllMocks()
})

function party(overrides: Partial<Party> = {}): Party {
	return {
		id: 'party-1',
		shortcode: 'abc123',
		element: 2,
		user: { id: 'user-1', username: 'owner' },
		weapons: [],
		characters: [],
		summons: [],
		wonders: [],
		...overrides
	} as Party
}

function cachedParty(): Party {
	return queries.client.getQueryData<Party>(partyKeys.detail('abc123'))!
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mountPane(component: Component<any>, props: Record<string, unknown>) {
	const target = document.createElement('div')
	document.body.appendChild(target)
	// Wonder cards show their name in a tooltip, which needs the layout's provider
	mounted.push(
		mount(TooltipProviderTestHarness, { target, props: { component, paneProps: props } })
	)
	flushSync()
	return target
}

function render(p: Party) {
	queries.client.setQueryData(wonderKeys.catalogue(), catalogue)
	queries.client.setQueryData(partyKeys.detail(p.shortcode), p)
	return mountPane(EditWondersPane, { paneId: GRID, getParty: cachedParty })
}

/** The pane the last `sidebar.push` opened, mounted as PaneStack would. */
function mountPushed(paneId: string) {
	const config = sidebarMock.push.mock.calls.at(-1)?.[0] as PaneConfig | undefined
	if (!config) throw new Error('Nothing was pushed')
	return mountPane(config.component, { ...config.props, paneId })
}

/** The header action a pane set last; undefined while disabled. */
function action(paneId: string): { handler: (() => void) | undefined; label: string } {
	const call = sidebarMock.setActionForPane.mock.calls.filter((c) => c[0] === paneId).at(-1)
	if (!call) throw new Error(`No action for ${paneId}`)
	return { handler: call[1], label: call[2] }
}

function runAction(paneId: string) {
	const { handler } = action(paneId)
	if (!handler) throw new Error(`The action for ${paneId} is disabled`)
	handler()
}

function cardNames(root: ParentNode = document.body): string[] {
	return [...root.querySelectorAll('.wonder-card .name')].map((el) => el.textContent ?? '')
}

function clickCard(name: string, root: ParentNode = document.body) {
	const card = [...root.querySelectorAll<HTMLElement>('.wonder-card, .wonder')].find((el) =>
		el.querySelector('.name')?.textContent?.includes(name)
	)
	if (!card) throw new Error(`No card for ${name}`)
	card.click()
	flushSync()
}

function clickButton(label: string) {
	const button = [...document.querySelectorAll<HTMLButtonElement>('button')]
		.filter((el) => el.textContent?.trim() === label)
		.at(-1)
	if (!button) throw new Error(`No button labeled ${label}`)
	button.click()
	flushSync()
}

function lastPut(): PartyWonderInput[] {
	const calls = vi.mocked(wonderAdapter.updatePartyWonders).mock.calls
	return calls.at(-1)![1]
}

function echoPut() {
	vi.mocked(wonderAdapter.updatePartyWonders).mockImplementation(async (_id, wonders) =>
		wonders.map((w): OwnedWonder => ({
			id: `saved-${w.wonderId}`,
			granblueId: '',
			image: '',
			bonuses: [],
			...w
		}))
	)
}

describe('EditWondersPane', () => {
	it("shows the team's battle-relevant Wonders of every element, grouped by category", () => {
		const root = render(
			party({
				wonders: [owned(fireSeal, { level: 20, evolution: 3 }), owned(shield), owned(tiamat)]
			})
		)

		expect(cardNames(root)).toEqual([
			'Seal of the Blazing Bodhisattva',
			'Shield of Eternal Splendor'
		])
		expect(root.textContent).toContain('Crucible Seal')
		expect(root.textContent).toContain('Lvl 20')
		expect(root.textContent).toContain('Sync from collection')
		expect(action(GRID).label).toBe('Add')
		expect(action(GRID).handler).toBeDefined()
	})

	it('shows an empty state, and no sync for a team without an account', () => {
		const root = render(party({ user: undefined }))

		expect(root.querySelectorAll('.wonder-card')).toHaveLength(0)
		expect(root.textContent).toContain('No Wonders on this team')
		expect(root.textContent).not.toContain('Sync from collection')
	})

	it('hides Seals on Unite and Fight teams, and keeps them when saving', async () => {
		echoPut()
		const root = render(
			party({
				raid: UNITE_AND_FIGHT,
				wonders: [owned(waterSeal, { level: 20, evolution: 3 }), owned(shield)]
			})
		)
		expect(cardNames(root)).toEqual(['Shield of Eternal Splendor'])

		// Nor does the picker offer them
		runAction(GRID)
		const picker = mountPushed('picker')
		expect(picker.textContent).not.toContain('Seal of the')
		expect(picker.textContent).toContain('Symbolum Amicitiae')

		clickCard('Symbolum Amicitiae', picker)
		const setup = mountPushed('setup')
		runAction('setup')

		await vi.waitFor(() => expect(wonderAdapter.updatePartyWonders).toHaveBeenCalled())
		expect(lastPut()).toEqual([
			{ wonderId: waterSeal.id, level: 20, evolution: 3, possession: null },
			{ wonderId: shield.id, level: null, evolution: null, possession: null },
			{ wonderId: symbolum.id, level: null, evolution: null, possession: 0 }
		])
		expect(setup.textContent).not.toContain('Active')
	})

	it('edits a Wonder: Save waits for a change, then saves the set and comes back', async () => {
		echoPut()
		render(party({ wonders: [owned(fireSeal, { level: 20, evolution: 3 }), owned(shield)] }))

		clickCard('Seal of the Blazing Bodhisattva')
		const setup = mountPushed('setup')
		expect(setup.textContent).not.toContain('Active')
		expect(action('setup')).toEqual({ handler: undefined, label: 'Save' })

		// Tapping the third (filled) star empties it: uncap 3 -> 2, capping the level
		setup.querySelectorAll<HTMLButtonElement>('button.star-button')[2]!.click()
		flushSync()
		runAction('setup')

		await vi.waitFor(() => expect(sidebarMock.paneStack.popTo).toHaveBeenCalledWith(GRID))
		expect(lastPut()).toEqual([
			{ wonderId: fireSeal.id, level: 18, evolution: 2, possession: null },
			{ wonderId: shield.id, level: null, evolution: null, possession: null }
		])
		expect(cachedParty().wonders?.[0]).toMatchObject({ wonderId: fireSeal.id, level: 18 })
		expect(sidebarMock.close).not.toHaveBeenCalled()
	})

	it('removes a Wonder after confirming', async () => {
		echoPut()
		render(party({ wonders: [owned(shield), owned(ringOfDeath)] }))

		clickCard('Ring of Death')
		mountPushed('setup')
		const menu = sidebarMock.setOverflowMenuForPane.mock.calls.find((c) => c[0] === 'setup')
		expect(menu?.[1]).toMatchObject([{ label: 'Remove from team', variant: 'danger' }])

		menu![1][0].handler()
		flushSync()
		await vi.waitFor(() => expect(document.body.textContent).toContain('Remove Ring of Death'))
		expect(wonderAdapter.updatePartyWonders).not.toHaveBeenCalled()

		clickButton('Remove from team')
		await vi.waitFor(() => expect(sidebarMock.paneStack.popTo).toHaveBeenCalledWith(GRID))
		expect(lastPut()).toEqual([
			{ wonderId: shield.id, level: null, evolution: null, possession: null }
		])
	})

	it('adds a fixed Wonder by selecting it and using Add', async () => {
		echoPut()
		render(party({ wonders: [owned(shield)] }))

		runAction(GRID)
		const picker = mountPushed('picker')
		// Already on the team, so not offered
		expect(picker.textContent).not.toContain('Shield of Eternal Splendor')
		expect(action('picker').handler).toBeUndefined()

		clickCard('Ring of Death', picker)
		expect(sidebarMock.push).toHaveBeenCalledTimes(1)
		runAction('picker')

		await vi.waitFor(() => expect(sidebarMock.paneStack.popTo).toHaveBeenCalledWith(GRID))
		expect(lastPut()).toEqual([
			{ wonderId: shield.id, level: null, evolution: null, possession: null },
			{ wonderId: ringOfDeath.id, level: null, evolution: null, possession: null }
		])
	})

	it('adds a leveled Wonder through its setup pane, whose Add works unedited', async () => {
		echoPut()
		render(party())

		runAction(GRID)
		const picker = mountPushed('picker')
		clickCard("Zhurong's Yupei", picker)
		const setup = mountPushed('setup')
		expect(action('setup').label).toBe('Add')

		// Backing out unedited doesn't warn; once edited it does
		const unsaved = () => {
			const call = sidebarMock.paneStack.updatePaneById.mock.calls
				.filter((c) => c[0] === 'setup')
				.at(-1)
			return (call![1] as PaneConfig).hasUnsavedChanges!()
		}
		expect(unsaved()).toBe(false)
		const input = setup.querySelector<HTMLInputElement>('input[type="number"]')!
		input.value = '5'
		input.dispatchEvent(new Event('change', { bubbles: true }))
		flushSync()
		expect(unsaved()).toBe(true)

		runAction('setup')
		await vi.waitFor(() => expect(sidebarMock.paneStack.popTo).toHaveBeenCalledWith(GRID))
		expect(lastPut()).toEqual([{ wonderId: zhurong.id, level: 5, evolution: 0, possession: null }])
	})

	it('syncs an empty team at once and writes the result into the party', async () => {
		const synced = [owned(waterSeal, { level: 15, evolution: 1, image: '9008_15' })]
		vi.mocked(wonderAdapter.syncPartyWonders).mockResolvedValue(synced)
		render(party())

		clickButton('Sync from collection')

		await vi.waitFor(() => expect(cachedParty().wonders).toEqual(synced))
		expect(wonderAdapter.syncPartyWonders).toHaveBeenCalledWith('party-1', undefined)
		expect(wonderAdapter.updatePartyWonders).not.toHaveBeenCalled()
	})

	it("confirms before syncing over the team's Wonders", async () => {
		vi.mocked(wonderAdapter.syncPartyWonders).mockResolvedValue([])
		render(party({ wonders: [owned(shield)] }))

		clickButton('Sync from collection')
		await vi.waitFor(() =>
			expect(document.body.textContent).toContain('Sync Wonders from the collection?')
		)
		expect(wonderAdapter.syncPartyWonders).not.toHaveBeenCalled()

		clickButton('Sync from collection')
		await vi.waitFor(() => expect(cachedParty().wonders).toEqual([]))
		expect(wonderAdapter.syncPartyWonders).toHaveBeenCalledTimes(1)
	})
})
