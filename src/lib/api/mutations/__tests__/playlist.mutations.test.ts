/**
 * Playlist mutation tests
 *
 * Tests the options factories exported from playlist.mutations.ts.
 * Each factory is exercised with a real QueryClient so we can
 * assert on cache state after optimistic updates, rollbacks,
 * and invalidations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
	createPlaylistOptions,
	updatePlaylistOptions,
	deletePlaylistOptions,
	addPartyToPlaylistOptions,
	removePartyFromPlaylistOptions
} from '../playlist.mutations'
import { createTestQueryClient } from './helpers'
import { playlistKeys } from '$lib/api/queries/playlist.queries'
import type { QueryClient } from '@tanstack/svelte-query'
import type { Playlist } from '$lib/types/api/playlist'

// ============================================================================
// Mocks
// ============================================================================

vi.mock('$lib/api/adapters/playlist.adapter', () => ({
	playlistAdapter: {
		create: vi.fn(),
		update: vi.fn(),
		destroy: vi.fn(),
		addParty: vi.fn(),
		removeParty: vi.fn()
	}
}))

// ============================================================================
// Fixtures
// ============================================================================

const MOCK_PLAYLIST_ID = 'playlist-uuid-1'

const MOCK_PLAYLIST: Playlist = {
	id: MOCK_PLAYLIST_ID,
	title: 'Test Playlist',
	slug: 'test-playlist',
	description: 'A test playlist',
	visibility: 1,
	partyCount: 2,
	user: { id: 'user-1', username: 'testuser' },
	createdAt: '2024-01-01T00:00:00Z',
	updatedAt: '2024-01-01T00:00:00Z'
}

// ============================================================================
// Helpers
// ============================================================================

function seedPlaylistCache(queryClient: QueryClient, playlist: Playlist): void {
	queryClient.setQueryData(playlistKeys.detail(playlist.slug), playlist)
}

function getCachedPlaylist(queryClient: QueryClient, slug: string): Playlist | undefined {
	return queryClient.getQueryData<Playlist>(playlistKeys.detail(slug))
}

// ============================================================================
// Setup
// ============================================================================

let queryClient: QueryClient

beforeEach(() => {
	queryClient = createTestQueryClient()
	seedPlaylistCache(queryClient, MOCK_PLAYLIST)
})

// ============================================================================
// createPlaylist
// ============================================================================

describe('createPlaylistOptions', () => {
	it('sets the new playlist in cache on success', () => {
		const opts = createPlaylistOptions(queryClient)
		const newPlaylist: Playlist = {
			...MOCK_PLAYLIST,
			id: 'new-id',
			slug: 'new-playlist',
			title: 'New Playlist'
		}

		opts.onSuccess(newPlaylist)

		expect(getCachedPlaylist(queryClient, 'new-playlist')).toEqual(newPlaylist)
	})

	it('invalidates playlist list queries on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = createPlaylistOptions(queryClient)

		opts.onSuccess(MOCK_PLAYLIST)

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(playlistKeys.userLists())
	})
})

// ============================================================================
// updatePlaylist
// ============================================================================

describe('updatePlaylistOptions', () => {
	it('optimistically merges updates into cached playlist', async () => {
		const opts = updatePlaylistOptions(queryClient)
		const params = { id: MOCK_PLAYLIST_ID, slug: 'test-playlist', title: 'Updated Title' }

		await opts.onMutate(params)

		const cached = getCachedPlaylist(queryClient, 'test-playlist')
		expect(cached?.title).toBe('Updated Title')
	})

	it('rolls back to previous state on error', async () => {
		const opts = updatePlaylistOptions(queryClient)
		const params = { id: MOCK_PLAYLIST_ID, slug: 'test-playlist', title: 'Failed Update' }

		const context = await opts.onMutate(params)
		opts.onError(new Error('fail'), params, context)

		const cached = getCachedPlaylist(queryClient, 'test-playlist')
		expect(cached?.title).toBe('Test Playlist')
	})

	it('merges server response on success', () => {
		const opts = updatePlaylistOptions(queryClient)
		const serverResponse: Playlist = { ...MOCK_PLAYLIST, title: 'Server Title' }

		opts.onSuccess(serverResponse, { id: MOCK_PLAYLIST_ID, slug: 'test-playlist' })

		const cached = getCachedPlaylist(queryClient, 'test-playlist')
		expect(cached?.title).toBe('Server Title')
	})

	it('invalidates detail and list queries on settled', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updatePlaylistOptions(queryClient)

		opts.onSettled(undefined, undefined, { id: MOCK_PLAYLIST_ID, slug: 'test-playlist' })

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(playlistKeys.details())
		expect(keys).toContainEqual(playlistKeys.userLists())
	})
})

// ============================================================================
// deletePlaylist
// ============================================================================

describe('deletePlaylistOptions', () => {
	it('invalidates detail queries on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = deletePlaylistOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(playlistKeys.details())
	})

	it('invalidates list queries on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = deletePlaylistOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(playlistKeys.userLists())
	})
})

// ============================================================================
// addPartyToPlaylist
// ============================================================================

describe('addPartyToPlaylistOptions', () => {
	it('invalidates all playlist queries on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = addPartyToPlaylistOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(playlistKeys.all)
		expect(keys).toContainEqual(playlistKeys.details())
	})
})

// ============================================================================
// removePartyFromPlaylist
// ============================================================================

describe('removePartyFromPlaylistOptions', () => {
	it('invalidates all playlist queries on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = removePartyFromPlaylistOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(playlistKeys.all)
		expect(keys).toContainEqual(playlistKeys.details())
	})
})
