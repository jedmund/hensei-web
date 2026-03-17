/**
 * Playlist Mutation Configurations
 *
 * Provides mutation configurations for playlist CRUD and party management
 * with cache invalidation and optimistic updates using TanStack Query v6.
 *
 * Each mutation exports both an options factory (for testing) and a hook (for components).
 *
 * @module api/mutations/playlist
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import {
	playlistAdapter,
	type CreatePlaylistParams,
	type UpdatePlaylistParams
} from '$lib/api/adapters/playlist.adapter'
import { playlistKeys } from '$lib/api/queries/playlist.queries'
import type { Playlist } from '$lib/types/api/playlist'

// ============================================================================
// Options Factories
// ============================================================================

export function createPlaylistOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: CreatePlaylistParams) => playlistAdapter.create(params),
		onSuccess: (playlist: Playlist) => {
			queryClient.setQueryData(playlistKeys.detail(playlist.slug), playlist)
			queryClient.invalidateQueries({ queryKey: playlistKeys.userLists() })
			queryClient.invalidateQueries({ queryKey: playlistKeys.all })
		}
	}
}

export function updatePlaylistOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: UpdatePlaylistParams & { slug: string }) => playlistAdapter.update(params),
		onMutate: async (params: UpdatePlaylistParams & { slug: string }) => {
			await queryClient.cancelQueries({ queryKey: playlistKeys.detail(params.slug) })

			const previous = queryClient.getQueryData<Playlist>(playlistKeys.detail(params.slug))

			if (previous) {
				queryClient.setQueryData(playlistKeys.detail(params.slug), {
					...previous,
					...params
				})
			}

			return { previous }
		},
		onSuccess: (data: Playlist, params: UpdatePlaylistParams & { slug: string }) => {
			// If title changed, slug may have changed — remove old cache entry
			if (data.slug !== params.slug) {
				queryClient.removeQueries({ queryKey: playlistKeys.detail(params.slug) })
			}
			queryClient.setQueryData(playlistKeys.detail(data.slug), (old: Playlist | undefined) =>
				old ? { ...old, ...data } : data
			)
		},
		onError: (
			_err: unknown,
			params: UpdatePlaylistParams & { slug: string },
			context: { previous?: Playlist } | undefined
		) => {
			if (context?.previous) {
				queryClient.setQueryData(playlistKeys.detail(params.slug), context.previous)
			}
		},
		onSettled: (_data: unknown, _err: unknown, params: UpdatePlaylistParams & { slug: string }) => {
			queryClient.invalidateQueries({ queryKey: playlistKeys.details() })
			queryClient.invalidateQueries({ queryKey: playlistKeys.userLists() })
		}
	}
}

export function deletePlaylistOptions(queryClient: QueryClient) {
	return {
		mutationFn: (id: string) => playlistAdapter.destroy(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: playlistKeys.details() })
			queryClient.invalidateQueries({ queryKey: playlistKeys.userLists() })
			queryClient.invalidateQueries({ queryKey: playlistKeys.all })
		}
	}
}

export function addPartyToPlaylistOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ playlistId, partyId }: { playlistId: string; partyId: string }) =>
			playlistAdapter.addParty(playlistId, partyId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: playlistKeys.all })
			queryClient.invalidateQueries({ queryKey: playlistKeys.details() })
		}
	}
}

export function removePartyFromPlaylistOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ playlistId, partyId }: { playlistId: string; partyId: string }) =>
			playlistAdapter.removeParty(playlistId, partyId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: playlistKeys.all })
			queryClient.invalidateQueries({ queryKey: playlistKeys.details() })
		}
	}
}

// ============================================================================
// Hooks (thin wrappers for component use)
// ============================================================================

export function useCreatePlaylist() {
	const queryClient = useQueryClient()
	return createMutation(() => createPlaylistOptions(queryClient))
}

export function useUpdatePlaylist() {
	const queryClient = useQueryClient()
	return createMutation(() => updatePlaylistOptions(queryClient))
}

export function useDeletePlaylist() {
	const queryClient = useQueryClient()
	return createMutation(() => deletePlaylistOptions(queryClient))
}

export function useAddPartyToPlaylist() {
	const queryClient = useQueryClient()
	return createMutation(() => addPartyToPlaylistOptions(queryClient))
}

export function useRemovePartyFromPlaylist() {
	const queryClient = useQueryClient()
	return createMutation(() => removePartyFromPlaylistOptions(queryClient))
}
