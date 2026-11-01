import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushSync } from 'svelte'
import { AddToCollectionState } from '../addToCollectionState.svelte'
import type { AddToCollectionEntityType, AddToCollectionResult } from '../add-to-collection.utils'

type QueryOptions = { queryKey?: readonly unknown[]; enabled?: boolean }

const mocks = vi.hoisted(() => ({
	/** Options of the search (infinite) query, re-evaluated on read */
	searchOptions: undefined as (() => QueryOptions) | undefined,
	searchPages: [] as { results: unknown[] }[],
	collectedIds: undefined as string[] | undefined,
	collectedIdsLoading: false,
	loaderReset: vi.fn(),
	loaderDestroy: vi.fn(),
	mutations: {
		character: { mutateAsync: vi.fn(), isPending: false },
		weapon: { mutateAsync: vi.fn(), isPending: false },
		summon: { mutateAsync: vi.fn(), isPending: false }
	},
	toastError: vi.fn()
}))

vi.mock('@tanstack/svelte-query', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@tanstack/svelte-query')>()
	return {
		...actual,
		createQuery: (fn: () => QueryOptions) => ({
			get data() {
				return fn().enabled === false ? undefined : mocks.collectedIds
			},
			get isLoading() {
				return mocks.collectedIdsLoading
			}
		}),
		createInfiniteQuery: (fn: () => QueryOptions) => {
			mocks.searchOptions = fn
			return {
				get data() {
					return fn().enabled === false ? undefined : { pages: mocks.searchPages }
				},
				isLoading: false,
				hasNextPage: false,
				isFetchingNextPage: false
			}
		}
	}
})

vi.mock('$lib/api/mutations/collection.mutations', () => ({
	useAddCharactersToCollection: () => mocks.mutations.character,
	useAddWeaponsToCollection: () => mocks.mutations.weapon,
	useAddSummonsToCollection: () => mocks.mutations.summon
}))

vi.mock('$lib/stores/loaderState.svelte', () => ({
	useInfiniteLoader: () => ({ reset: mocks.loaderReset, destroy: mocks.loaderDestroy })
}))

vi.mock('svelte-sonner', () => ({ toast: { error: mocks.toastError } }))

function item(id: string): AddToCollectionResult {
	return { id, granblueId: id, name: { en: id }, searchableType: 'Weapon' }
}

const cleanups: (() => void)[] = []

function create(initial: { entityType?: AddToCollectionEntityType; open?: boolean } = {}) {
	const props = $state({ entityType: initial.entityType ?? 'weapon', open: initial.open ?? true })
	let state!: AddToCollectionState
	const cleanup = $effect.root(() => {
		state = new AddToCollectionState({
			userId: () => 'u-self',
			entityType: () => props.entityType,
			open: () => props.open
		})
	})
	cleanups.push(cleanup)
	flushSync()
	return { state, props, cleanup }
}

beforeEach(() => {
	mocks.searchOptions = undefined
	mocks.searchPages = []
	mocks.collectedIds = undefined
	mocks.collectedIdsLoading = false
	mocks.loaderReset.mockClear()
	mocks.toastError.mockClear()
	for (const mutation of Object.values(mocks.mutations)) {
		mutation.mutateAsync.mockReset()
		mutation.isPending = false
	}
})

afterEach(() => {
	for (const cleanup of cleanups.splice(0)) cleanup()
})

describe('AddToCollectionState', () => {
	describe('search query', () => {
		it('runs the weapon search only while the modal is open', () => {
			const { props } = create()
			expect(mocks.searchOptions?.().enabled).toBe(true)
			props.open = false
			expect(mocks.searchOptions?.().enabled).toBe(false)
		})

		it('waits for the collected character ids and excludes them', () => {
			mocks.collectedIdsLoading = true
			create({ entityType: 'character' })
			expect(mocks.searchOptions?.().enabled).toBe(false)

			mocks.collectedIdsLoading = false
			mocks.collectedIds = ['owned-1']
			const options = mocks.searchOptions?.()
			expect(options?.enabled).toBe(true)
			expect(JSON.stringify(options?.queryKey)).toContain('owned-1')
		})

		it('is loading while the collected character ids load', () => {
			mocks.collectedIdsLoading = true
			expect(create({ entityType: 'character' }).state.isLoading).toBe(true)
			expect(create({ entityType: 'weapon' }).state.isLoading).toBe(false)
		})

		it('dedupes results across pages', () => {
			mocks.searchPages = [{ results: [item('a'), item('b')] }, { results: [item('a')] }]
			expect(create().state.allResults.map((r) => r.id)).toEqual(['a', 'b'])
		})
	})

	describe('filters', () => {
		it('applies filter changes and drops numeric series', () => {
			const { state } = create()
			state.setFilters({
				element: [2],
				rarity: [],
				season: [],
				series: [1, 'uuid'],
				race: [],
				proficiency: [],
				gender: []
			})
			expect(state.filters.element).toEqual([2])
			expect(state.filters.series).toEqual(['uuid'])
			expect(state.hasActiveSearch).toBe(true)
		})

		it('restarts paging when the filters or show-selected change, not the query', () => {
			const { state } = create()
			mocks.loaderReset.mockClear()
			state.searchQuery = 'gran'
			flushSync()
			expect(mocks.loaderReset).not.toHaveBeenCalled()
			state.elementFilters = [1]
			flushSync()
			state.toggleShowSelected()
			flushSync()
			expect(mocks.loaderReset).toHaveBeenCalledTimes(2)
		})

		it('stops the loader when torn down', () => {
			const { cleanup } = create()
			cleanups.splice(0)
			mocks.loaderDestroy.mockClear()
			cleanup()
			expect(mocks.loaderDestroy).toHaveBeenCalledTimes(1)
		})
	})

	describe('selection', () => {
		it('toggles characters and shows only the selected ones', () => {
			mocks.searchPages = [{ results: [item('a'), item('b')] }]
			const { state } = create({ entityType: 'character' })
			state.toggleCharacter(item('a'))
			state.toggleCharacter(item('b'))
			state.toggleCharacter(item('b'))
			expect(state.selectedCount).toBe(1)
			state.toggleShowSelected()
			expect(state.displayedResults.map((r) => r.id)).toEqual(['a'])
		})

		it('tracks weapon quantities and drops items set to zero', () => {
			mocks.searchPages = [{ results: [item('a'), item('b')] }]
			const { state } = create()
			state.setQuantity(item('a'), 2)
			state.setQuantity(item('b'), 1)
			expect(state.selectedCount).toBe(3)
			expect(state.selectedItemCount).toBe(2)
			state.setQuantity(item('b'), 0)
			expect(state.selectedQuantities.has('b')).toBe(false)
			state.toggleShowSelected()
			expect(state.displayedResults.map((r) => r.id)).toEqual(['a'])
		})

		it('resets everything when the modal closes', () => {
			const { state, props } = create()
			state.searchQuery = 'gran'
			state.elementFilters = [1]
			state.seriesFilters = ['uuid']
			state.setQuantity(item('a'), 2)
			state.selectedIds.add('c')
			state.toggleShowSelected()
			props.open = false
			flushSync()
			expect(state.searchQuery).toBe('')
			expect(state.elementFilters).toEqual([])
			expect(state.seriesFilters).toEqual([])
			expect(state.selectedQuantities.size).toBe(0)
			expect(state.selectedIds.size).toBe(0)
			expect(state.showOnlySelected).toBe(false)
		})
	})

	describe('adding', () => {
		it('sends maxed weapons with their quantities', async () => {
			mocks.searchPages = [{ results: [{ ...item('a'), uncap: { flb: true } }] }]
			mocks.mutations.weapon.mutateAsync.mockResolvedValue(undefined)
			const { state } = create()
			state.setQuantity(item('a'), 2)
			await expect(state.add()).resolves.toBe(true)
			expect(mocks.mutations.weapon.mutateAsync).toHaveBeenCalledWith([
				{ weaponId: 'a', quantity: 2, uncapLevel: 4, transcendenceStep: 0 }
			])
		})

		it('uses the mutation for the entity type', async () => {
			mocks.mutations.character.mutateAsync.mockResolvedValue(undefined)
			const { state } = create({ entityType: 'character' })
			state.toggleCharacter(item('c'))
			await expect(state.add()).resolves.toBe(true)
			expect(mocks.mutations.character.mutateAsync).toHaveBeenCalledWith([
				{ characterId: 'c', uncapLevel: 4, transcendenceStep: 0 }
			])
			expect(mocks.mutations.weapon.mutateAsync).not.toHaveBeenCalled()
		})

		it('does nothing with an empty selection', async () => {
			const { state } = create({ entityType: 'summon' })
			await expect(state.add()).resolves.toBe(false)
			expect(mocks.mutations.summon.mutateAsync).not.toHaveBeenCalled()
		})

		it('toasts failures but not cancellations', async () => {
			const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
			const { state } = create({ entityType: 'summon' })
			state.setQuantity(item('s'), 1)

			mocks.mutations.summon.mutateAsync.mockRejectedValueOnce({ name: 'CancelledError' })
			await expect(state.add()).resolves.toBe(false)
			expect(mocks.toastError).not.toHaveBeenCalled()

			mocks.mutations.summon.mutateAsync.mockRejectedValueOnce(new Error('boom'))
			await expect(state.add()).resolves.toBe(false)
			expect(mocks.toastError).toHaveBeenCalledWith('boom')
			consoleError.mockRestore()
		})

		it('reports the pending mutation for the entity type', () => {
			const { state, props } = create()
			mocks.mutations.summon.isPending = true
			expect(state.isAdding).toBe(false)
			props.entityType = 'summon'
			expect(state.isAdding).toBe(true)
		})
	})
})
