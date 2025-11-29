/**
 * Party Query Options Factory
 *
 * Provides type-safe, reusable query configurations for party operations
 * using TanStack Query v6 patterns.
 *
 * @module api/queries/party
 */

import { queryOptions, infiniteQueryOptions } from '@tanstack/svelte-query'
import {
	partyAdapter,
	type ListUserPartiesParams
} from '$lib/api/adapters/party.adapter'
import type { Party } from '$lib/types/api/party'

/**
 * Standard page result format for infinite queries
 */
export interface PartyPageResult {
	results: Party[]
	page: number
	totalPages: number
	total?: number
	perPage?: number
}

/**
 * Parameters for listing parties
 */
export interface ListPartiesParams {
	page?: number
	per?: number
}

/**
 * Party query options factory
 *
 * Provides query configurations for all party-related operations.
 * These can be used with `createQuery`, `createInfiniteQuery`, or for prefetching.
 *
 * @example
 * ```typescript
 * import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
 * import { partyQueries } from '$lib/api/queries/party.queries'
 *
 * // Single party by shortcode
 * const party = createQuery(() => partyQueries.byShortcode(shortcode))
 *
 * // Infinite list of parties
 * const parties = createInfiniteQuery(() => partyQueries.list())
 * ```
 */
export const partyQueries = {
	/**
	 * Single party query options
	 *
	 * @param shortcode - Party shortcode identifier
	 * @returns Query options for fetching a single party
	 */
	byShortcode: (shortcode: string) =>
		queryOptions({
			queryKey: ['party', shortcode] as const,
			queryFn: () => partyAdapter.getByShortcode(shortcode),
			enabled: !!shortcode,
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 30 // 30 minutes
		}),

	/**
	 * Public parties list (explore page) infinite query options
	 *
	 * @param params - Optional pagination parameters
	 * @returns Infinite query options for listing public parties
	 */
	list: (params?: Omit<ListPartiesParams, 'page'>) =>
		infiniteQueryOptions({
			queryKey: ['parties', 'list', params] as const,
			queryFn: async ({ pageParam }): Promise<PartyPageResult> => {
				const response = await partyAdapter.list({
					...params,
					page: pageParam
				})
				return {
					results: response.results,
					page: response.page,
					totalPages: response.totalPages,
					total: response.total,
					perPage: response.perPage
				}
			},
			initialPageParam: 1,
			getNextPageParam: (lastPage) => {
				if (lastPage.page < lastPage.totalPages) {
					return lastPage.page + 1
				}
				return undefined
			},
			staleTime: 1000 * 60 * 2, // 2 minutes - parties change more frequently
			gcTime: 1000 * 60 * 15 // 15 minutes
		}),

	/**
	 * User parties list infinite query options
	 *
	 * @param username - Username to fetch parties for
	 * @param params - Optional filter parameters
	 * @returns Infinite query options for listing user's parties
	 */
	userParties: (
		username: string,
		params?: Omit<ListUserPartiesParams, 'username' | 'page'>
	) =>
		infiniteQueryOptions({
			queryKey: ['parties', 'user', username, params] as const,
			queryFn: async ({ pageParam }): Promise<PartyPageResult> => {
				const response = await partyAdapter.listUserParties({
					username,
					...params,
					page: pageParam
				})
				return {
					results: response.results,
					page: response.page,
					totalPages: response.totalPages,
					total: response.total,
					perPage: response.perPage
				}
			},
			initialPageParam: 1,
			getNextPageParam: (lastPage) => {
				if (lastPage.page < lastPage.totalPages) {
					return lastPage.page + 1
				}
				return undefined
			},
			enabled: !!username,
			staleTime: 1000 * 60 * 2, // 2 minutes
			gcTime: 1000 * 60 * 15 // 15 minutes
		}),

	/**
	 * Party preview status query options
	 *
	 * @param shortcode - Party shortcode identifier
	 * @returns Query options for fetching party preview status
	 */
	previewStatus: (shortcode: string) =>
		queryOptions({
			queryKey: ['party', shortcode, 'preview'] as const,
			queryFn: () => partyAdapter.getPreviewStatus(shortcode),
			enabled: !!shortcode,
			staleTime: 1000 * 30, // 30 seconds - preview status changes
			gcTime: 1000 * 60 * 5 // 5 minutes
		})
}

/**
 * Query key helpers for cache invalidation
 *
 * @example
 * ```typescript
 * import { useQueryClient } from '@tanstack/svelte-query'
 * import { partyKeys } from '$lib/api/queries/party.queries'
 *
 * const queryClient = useQueryClient()
 *
 * // Invalidate a specific party
 * queryClient.invalidateQueries({ queryKey: partyKeys.detail('abc123') })
 *
 * // Invalidate all party lists
 * queryClient.invalidateQueries({ queryKey: partyKeys.lists() })
 * ```
 */
export const partyKeys = {
	all: ['parties'] as const,
	lists: () => [...partyKeys.all, 'list'] as const,
	list: (params?: ListPartiesParams) => [...partyKeys.lists(), params] as const,
	userLists: () => [...partyKeys.all, 'user'] as const,
	userList: (username: string, params?: Omit<ListUserPartiesParams, 'username'>) =>
		[...partyKeys.userLists(), username, params] as const,
	details: () => ['party'] as const,
	detail: (shortcode: string) => [...partyKeys.details(), shortcode] as const,
	preview: (shortcode: string) => [...partyKeys.detail(shortcode), 'preview'] as const
}
