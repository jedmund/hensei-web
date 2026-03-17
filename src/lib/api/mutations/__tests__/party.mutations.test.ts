/**
 * Party mutation tests
 *
 * Tests the options factories exported from party.mutations.ts.
 * Each factory is exercised with a real QueryClient so we can
 * assert on cache state after optimistic updates, rollbacks,
 * and invalidations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
	createPartyOptions,
	updatePartyOptions,
	deletePartyOptions,
	remixPartyOptions,
	favoritePartyOptions,
	unfavoritePartyOptions,
	regeneratePreviewOptions,
	sharePartyWithCrewOptions,
	removePartyShareOptions
} from '../party.mutations'
import { createTestQueryClient, seedPartyCache, getCachedParty } from './helpers'
import { MOCK_PARTY, MOCK_SHORTCODE } from './fixtures'
import type { QueryClient } from '@tanstack/svelte-query'
import type { Party } from '$lib/types/api/party'

// ============================================================================
// Mocks
// ============================================================================

vi.mock('$lib/api/adapters/party.adapter', () => ({
	partyAdapter: {
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		remix: vi.fn(),
		favorite: vi.fn(),
		unfavorite: vi.fn(),
		regeneratePreview: vi.fn(),
		shareWithCrew: vi.fn(),
		removeShare: vi.fn()
	}
}))

// ============================================================================
// Setup
// ============================================================================

let queryClient: QueryClient

beforeEach(() => {
	queryClient = createTestQueryClient()
	seedPartyCache(queryClient, MOCK_PARTY)
})

// ============================================================================
// createParty
// ============================================================================

describe('createPartyOptions', () => {
	it('sets the new party in cache on success', () => {
		const opts = createPartyOptions(queryClient)
		const newParty: Party = { ...MOCK_PARTY, shortcode: 'NEW123', id: 'new-id' }

		opts.onSuccess(newParty)

		expect(getCachedParty(queryClient, 'NEW123')).toEqual(newParty)
	})

	it('invalidates party lists on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = createPartyOptions(queryClient)
		const newParty: Party = { ...MOCK_PARTY, shortcode: 'NEW123' }

		opts.onSuccess(newParty)

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(['parties', 'list'])
	})

	it('invalidates user queries on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = createPartyOptions(queryClient)
		const newParty: Party = { ...MOCK_PARTY, shortcode: 'NEW123' }

		opts.onSuccess(newParty)

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(['user'])
	})
})

// ============================================================================
// updateParty
// ============================================================================

describe('updatePartyOptions', () => {
	it('optimistically merges updates into cached party', async () => {
		const opts = updatePartyOptions(queryClient)
		const params = { id: MOCK_PARTY.id, shortcode: MOCK_SHORTCODE, name: 'Updated Name' }

		await opts.onMutate(params)

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.name).toBe('Updated Name')
	})

	it('returns snapshot for rollback', async () => {
		const opts = updatePartyOptions(queryClient)
		const params = { id: MOCK_PARTY.id, shortcode: MOCK_SHORTCODE, name: 'Updated' }

		const context = await opts.onMutate(params)

		expect(context.previousParty).toEqual(MOCK_PARTY)
	})

	it('rolls back on error', async () => {
		const opts = updatePartyOptions(queryClient)
		const params = { id: MOCK_PARTY.id, shortcode: MOCK_SHORTCODE, name: 'Updated' }

		const context = await opts.onMutate(params)
		opts.onError(new Error('fail'), params, context)

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.name).toBe('Test Party')
	})

	it('does nothing on error without context', () => {
		const opts = updatePartyOptions(queryClient)
		const params = { id: MOCK_PARTY.id, shortcode: MOCK_SHORTCODE, name: 'Updated' }

		// should not throw
		opts.onError(new Error('fail'), params, undefined)

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached).toEqual(MOCK_PARTY)
	})

	it('invalidates party on settled', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updatePartyOptions(queryClient)
		const params = { id: MOCK_PARTY.id, shortcode: MOCK_SHORTCODE }

		opts.onSettled(undefined, undefined, params)

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(['party', MOCK_SHORTCODE])
	})
})

// ============================================================================
// deleteParty
// ============================================================================

describe('deletePartyOptions', () => {
	it('removes party from cache on success', () => {
		const opts = deletePartyOptions(queryClient)
		const params = { id: MOCK_PARTY.id, shortcode: MOCK_SHORTCODE }

		opts.onSuccess(undefined, params)

		expect(getCachedParty(queryClient, MOCK_SHORTCODE)).toBeUndefined()
	})

	it('invalidates party lists on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = deletePartyOptions(queryClient)

		opts.onSuccess(undefined, { id: MOCK_PARTY.id, shortcode: MOCK_SHORTCODE })

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(['parties', 'list'])
	})

	it('invalidates user queries on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = deletePartyOptions(queryClient)

		opts.onSuccess(undefined, { id: MOCK_PARTY.id, shortcode: MOCK_SHORTCODE })

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(['user'])
	})
})

// ============================================================================
// remixParty
// ============================================================================

describe('remixPartyOptions', () => {
	it('sets remixed party in cache on success', () => {
		const opts = remixPartyOptions(queryClient)
		const remixed: Party = { ...MOCK_PARTY, shortcode: 'REMIX1', id: 'remixed-id' }

		opts.onSuccess(remixed)

		expect(getCachedParty(queryClient, 'REMIX1')).toEqual(remixed)
	})

	it('invalidates party lists and user queries on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = remixPartyOptions(queryClient)
		const remixed: Party = { ...MOCK_PARTY, shortcode: 'REMIX1' }

		opts.onSuccess(remixed)

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(['parties', 'list'])
		expect(keys).toContainEqual(['user'])
	})
})

// ============================================================================
// favoriteParty
// ============================================================================

describe('favoritePartyOptions', () => {
	const favoriteParams = { id: MOCK_PARTY.id, shortcode: MOCK_SHORTCODE }

	it('optimistically sets favorited to true', async () => {
		const opts = favoritePartyOptions(queryClient)

		await opts.onMutate(favoriteParams)

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.favorited).toBe(true)
	})

	it('returns snapshot for rollback', async () => {
		const opts = favoritePartyOptions(queryClient)

		const context = await opts.onMutate(favoriteParams)

		expect(context.previousParty?.favorited).toBe(false)
	})

	it('rolls back on error', async () => {
		const opts = favoritePartyOptions(queryClient)

		const context = await opts.onMutate(favoriteParams)
		expect(getCachedParty(queryClient, MOCK_SHORTCODE)?.favorited).toBe(true)

		opts.onError(new Error('fail'), favoriteParams, context)

		expect(getCachedParty(queryClient, MOCK_SHORTCODE)?.favorited).toBe(false)
	})

	it('invalidates favorites and party on settled', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = favoritePartyOptions(queryClient)

		opts.onSettled(undefined, undefined, favoriteParams)

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(['user', 'favorites'])
		expect(keys).toContainEqual(['party', MOCK_SHORTCODE])
	})
})

// ============================================================================
// unfavoriteParty
// ============================================================================

describe('unfavoritePartyOptions', () => {
	const favoriteParams = { id: MOCK_PARTY.id, shortcode: MOCK_SHORTCODE }

	it('optimistically sets favorited to false', async () => {
		// seed a favorited party
		const favParty = { ...MOCK_PARTY, favorited: true }
		seedPartyCache(queryClient, favParty)

		const opts = unfavoritePartyOptions(queryClient)
		await opts.onMutate(favoriteParams)

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.favorited).toBe(false)
	})

	it('returns snapshot for rollback', async () => {
		const favParty = { ...MOCK_PARTY, favorited: true }
		seedPartyCache(queryClient, favParty)

		const opts = unfavoritePartyOptions(queryClient)
		const context = await opts.onMutate(favoriteParams)

		expect(context.previousParty?.favorited).toBe(true)
	})

	it('rolls back on error', async () => {
		const favParty = { ...MOCK_PARTY, favorited: true }
		seedPartyCache(queryClient, favParty)

		const opts = unfavoritePartyOptions(queryClient)
		const context = await opts.onMutate(favoriteParams)
		expect(getCachedParty(queryClient, MOCK_SHORTCODE)?.favorited).toBe(false)

		opts.onError(new Error('fail'), favoriteParams, context)

		expect(getCachedParty(queryClient, MOCK_SHORTCODE)?.favorited).toBe(true)
	})

	it('invalidates favorites and party on settled', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = unfavoritePartyOptions(queryClient)

		opts.onSettled(undefined, undefined, favoriteParams)

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(['user', 'favorites'])
		expect(keys).toContainEqual(['party', MOCK_SHORTCODE])
	})
})

// ============================================================================
// regeneratePreview
// ============================================================================

describe('regeneratePreviewOptions', () => {
	it('invalidates preview key on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = regeneratePreviewOptions(queryClient)

		opts.onSuccess(undefined, MOCK_SHORTCODE)

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(['party', MOCK_SHORTCODE, 'preview'])
	})
})

// ============================================================================
// sharePartyWithCrew
// ============================================================================

describe('sharePartyWithCrewOptions', () => {
	it('invalidates party detail on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = sharePartyWithCrewOptions(queryClient)

		opts.onSuccess(undefined, { partyId: MOCK_PARTY.id, shortcode: MOCK_SHORTCODE })

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(['party', MOCK_SHORTCODE])
	})

	it('invalidates crew shared parties on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = sharePartyWithCrewOptions(queryClient)

		opts.onSuccess(undefined, { partyId: MOCK_PARTY.id, shortcode: MOCK_SHORTCODE })

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(['crew', 'shared_parties'])
	})
})

// ============================================================================
// removePartyShare
// ============================================================================

describe('removePartyShareOptions', () => {
	it('invalidates party detail on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = removePartyShareOptions(queryClient)

		opts.onSuccess(undefined, { partyId: MOCK_PARTY.id, shareId: 'share-1', shortcode: MOCK_SHORTCODE })

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(['party', MOCK_SHORTCODE])
	})

	it('invalidates crew shared parties on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = removePartyShareOptions(queryClient)

		opts.onSuccess(undefined, { partyId: MOCK_PARTY.id, shareId: 'share-1', shortcode: MOCK_SHORTCODE })

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(['crew', 'shared_parties'])
	})
})
