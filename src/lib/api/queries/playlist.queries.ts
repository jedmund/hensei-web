/**
 * Playlist Query Options Factory
 *
 * Provides type-safe, reusable query configurations for playlist operations
 * using TanStack Query v6 patterns.
 *
 * @module api/queries/playlist
 */

import { queryOptions, infiniteQueryOptions } from '@tanstack/svelte-query'
import { playlistAdapter } from '$lib/api/adapters/playlist.adapter'
import type { Playlist } from '$lib/types/api/playlist'

export interface PlaylistPageResult {
	results: Playlist[]
	page: number
	totalPages: number
	total?: number
	perPage?: number
}

export const playlistQueries = {
	/**
	 * User's playlists list (profile tab) — infinite query
	 */
	userPlaylists: (username: string) =>
		infiniteQueryOptions({
			queryKey: ['playlists', 'user', username] as const,
			queryFn: async ({ pageParam }): Promise<PlaylistPageResult> => {
				const response = await playlistAdapter.list(username, pageParam)
				return {
					results: response.results,
					page: response.page,
					totalPages: response.totalPages,
					total: response.total,
					perPage: response.perPage
				}
			},
			initialPageParam: 1,
			getNextPageParam: (lastPage) =>
				lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
			enabled: !!username,
			staleTime: 1000 * 60 * 2,
			gcTime: 1000 * 60 * 15
		}),

	/**
	 * Single playlist with parties
	 */
	detail: (username: string, slug: string) =>
		queryOptions({
			queryKey: ['playlist', slug] as const,
			queryFn: () => playlistAdapter.get(username, slug),
			enabled: !!slug && !!username,
			staleTime: 1000 * 60 * 2,
			gcTime: 1000 * 60 * 30
		}),

	/**
	 * All playlists for the current user (non-paginated, for "Add to playlist" dialog)
	 */
	userPlaylistSummaries: (username: string) =>
		queryOptions({
			queryKey: ['playlists', 'summaries', username] as const,
			queryFn: async () => {
				const response = await playlistAdapter.list(username)
				return response.results
			},
			enabled: !!username,
			staleTime: 1000 * 60 * 2,
			gcTime: 1000 * 60 * 15
		})
}

export const playlistKeys = {
	all: ['playlists'] as const,
	userLists: () => [...playlistKeys.all, 'user'] as const,
	userList: (username: string) => [...playlistKeys.userLists(), username] as const,
	summaries: (username: string) => [...playlistKeys.all, 'summaries', username] as const,
	details: () => ['playlist'] as const,
	detail: (slug: string) => [...playlistKeys.details(), slug] as const
}
