import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushSync } from 'svelte'
import { SearchContentState, type SearchContentOptions } from '../searchContentState.svelte'

const mocks = vi.hoisted(() => ({
	/** Query data by serialized query key */
	queryData: new Map<string, unknown>(),
	loaderReset: vi.fn(),
	loaderDestroy: vi.fn()
}))

function keyOf(options: { queryKey?: readonly unknown[] }) {
	return JSON.stringify(options.queryKey ?? [])
}

vi.mock('@tanstack/svelte-query', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@tanstack/svelte-query')>()
	const fakeQuery = (fn: () => { queryKey?: readonly unknown[]; enabled?: boolean }) => ({
		get options() {
			return fn()
		},
		get data() {
			const options = fn()
			return options.enabled === false ? undefined : mocks.queryData.get(keyOf(options))
		},
		isLoading: false,
		isError: false,
		hasNextPage: false,
		isFetchingNextPage: false
	})
	return { ...actual, createQuery: fakeQuery, createInfiniteQuery: fakeQuery }
})

vi.mock('$lib/stores/loaderState.svelte', () => ({
	useInfiniteLoader: () => ({ reset: mocks.loaderReset, destroy: mocks.loaderDestroy })
}))

function options(overrides: Partial<Record<keyof SearchContentOptions, unknown>> = {}) {
	const values = {
		type: 'weapon',
		authUserId: 'u-self',
		requiredProficiencies: undefined,
		initialCollectionSourceUsername: undefined,
		isFriendSlot: false,
		isSubauraSlot: false,
		isExtraSlot: false,
		...overrides
	}
	return Object.fromEntries(
		Object.entries(values).map(([key, value]) => [key, () => value])
	) as unknown as SearchContentOptions
}

let cleanup: (() => void) | undefined

function create(overrides: Partial<Record<keyof SearchContentOptions, unknown>> = {}) {
	let state!: SearchContentState
	cleanup = $effect.root(() => {
		state = new SearchContentState(options(overrides))
	})
	flushSync()
	return state
}

beforeEach(() => {
	mocks.queryData.clear()
	mocks.loaderReset.mockClear()
})

afterEach(() => {
	cleanup?.()
	cleanup = undefined
	vi.useRealTimers()
})

describe('SearchContentState', () => {
	describe('search mode', () => {
		it('defaults to the catalogue search', () => {
			expect(create().searchMode).toBe('all')
		})

		it('starts on the collection when a collection source username is given', () => {
			expect(create({ initialCollectionSourceUsername: 'someone' }).searchMode).toBe('collection')
		})

		it('stays on the catalogue for the friend summon slot', () => {
			const state = create({ initialCollectionSourceUsername: 'someone', isFriendSlot: true })
			expect(state.searchMode).toBe('all')
		})

		it('can be switched by the user', () => {
			const state = create()
			state.searchMode = 'collection'
			expect(state.searchMode).toBe('collection')
		})
	})

	describe('query debounce', () => {
		it('updates the debounced query after 300ms', () => {
			vi.useFakeTimers()
			const state = create()
			state.searchQuery = 'gran'
			flushSync()
			vi.advanceTimersByTime(299)
			expect(state.debouncedSearchQuery).toBe('')
			vi.advanceTimersByTime(1)
			expect(state.debouncedSearchQuery).toBe('gran')
		})

		it('waits for IME composition to end', () => {
			vi.useFakeTimers()
			const state = create()
			state.handleCompositionStart()
			state.searchQuery = 'ぐら'
			flushSync()
			vi.advanceTimersByTime(500)
			expect(state.debouncedSearchQuery).toBe('')

			state.handleCompositionEnd()
			vi.advanceTimersByTime(50)
			flushSync()
			vi.advanceTimersByTime(300)
			expect(state.debouncedSearchQuery).toBe('ぐら')
		})

		it('clears the query and any pending debounce at once', () => {
			vi.useFakeTimers()
			const state = create()
			state.searchQuery = 'gran'
			flushSync()
			state.clearQuery()
			flushSync()
			vi.advanceTimersByTime(300)
			expect(state.searchQuery).toBe('')
			expect(state.debouncedSearchQuery).toBe('')
		})
	})

	describe('filters', () => {
		it('locks proficiency to the slot’s requirement on the catalogue search', () => {
			const state = create({ requiredProficiencies: [4] })
			state.proficiencyFilters = [1]
			expect(state.filters.proficiency).toEqual([4])
			state.searchMode = 'collection'
			expect(state.filters.proficiency).toEqual([1])
		})

		it('defaults the subaura filter to the slot and lets it be overridden', () => {
			const state = create({ type: 'summon', isSubauraSlot: true })
			expect(state.filters.subaura).toBe(true)
			state.subauraFilter = false
			expect(state.filters.subaura).toBeUndefined()
		})

		it('restarts paging when the filters change', () => {
			const state = create()
			mocks.loaderReset.mockClear()
			state.elementFilters = [2]
			flushSync()
			expect(mocks.loaderReset).toHaveBeenCalledTimes(1)
		})

		it('stops the loader when torn down', () => {
			create()
			mocks.loaderDestroy.mockClear()
			cleanup?.()
			cleanup = undefined
			expect(mocks.loaderDestroy).toHaveBeenCalledTimes(1)
		})
	})

	describe('collection owner', () => {
		it('selects an external collection source once it loads', () => {
			mocks.queryData.set(JSON.stringify(['user', 'someone', 'info']), {
				id: 'u-ext',
				username: 'someone',
				avatar: { picture: 'ext' }
			})
			const state = create({ initialCollectionSourceUsername: 'someone' })
			expect(state.selectedMemberId).toBe('u-ext')
			expect(state.collectionUserId).toBe('u-ext')
			expect(state.showMemberSection).toBe(true)
			expect(state.selectedMemberName).toBe('someone')
		})

		it('searches the signed-in user’s collection by default', () => {
			const state = create()
			state.searchMode = 'collection'
			expect(state.collectionUserId).toBe('u-self')
			expect(state.selectedMemberName).toBeUndefined()
			expect(state.showMemberSection).toBe(false)
		})
	})
})
