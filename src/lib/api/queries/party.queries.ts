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
	type ListUserPartiesParams,
	type ListRaidPartiesParams,
	type ExploreFilterParams
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
	per?: number
	filters?: ExploreFilterParams
}

/**
 * Filter options for raid parties query
 */
export interface RaidPartiesFilters {
	element?: number
	fullAuto?: boolean
	autoGuard?: boolean
	chargeAttack?: boolean
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
/**
 * Strips default/inactive filter values so the API only gets meaningful filters
 */
function buildFilterQuery(filters: ExploreFilterParams): Partial<ExploreFilterParams> {
	const query: Record<string, unknown> = {}

	if (filters.element && filters.element.length > 0) query.element = filters.element
	if (filters.raid) query.raid = filters.raid
	if (filters.recency !== undefined && filters.recency > 0) query.recency = filters.recency
	if (filters.job) query.job = filters.job

	if (filters.fullAuto !== undefined && filters.fullAuto !== -1) query.fullAuto = filters.fullAuto
	if (filters.autoGuard !== undefined && filters.autoGuard !== -1)
		query.autoGuard = filters.autoGuard
	if (filters.chargeAttack !== undefined && filters.chargeAttack !== -1)
		query.chargeAttack = filters.chargeAttack
	if (filters.hasVideo) query.hasVideo = filters.hasVideo

	if (filters.charactersCount !== undefined && filters.charactersCount > 0)
		query.charactersCount = filters.charactersCount
	if (filters.weaponsCount !== undefined && filters.weaponsCount > 0)
		query.weaponsCount = filters.weaponsCount
	if (filters.summonsCount !== undefined && filters.summonsCount > 0)
		query.summonsCount = filters.summonsCount

	if (filters.nameQuality) query.nameQuality = filters.nameQuality
	if (filters.userQuality) query.userQuality = filters.userQuality
	if (filters.original) query.original = filters.original

	if (filters.includes) query.includes = filters.includes
	if (filters.excludes) query.excludes = filters.excludes

	return query as Partial<ExploreFilterParams>
}

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
	list: (params?: ListPartiesParams) =>
		infiniteQueryOptions({
			queryKey: ['parties', 'list', params?.filters] as const,
			queryFn: async ({ pageParam }): Promise<PartyPageResult> => {
				const filterQuery = params?.filters ? buildFilterQuery(params.filters) : {}
				const response = await partyAdapter.list({
					per: params?.per,
					page: pageParam,
					...filterQuery
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
	 * Parties by raid infinite query options
	 *
	 * @param raidId - Raid ID to filter parties by
	 * @param filters - Optional filter parameters (element, battle settings)
	 * @returns Infinite query options for listing parties by raid
	 */
	raidParties: (raidId: string, filters?: RaidPartiesFilters) =>
		infiniteQueryOptions({
			queryKey: ['parties', 'raid', raidId, filters] as const,
			queryFn: async ({ pageParam }): Promise<PartyPageResult> => {
				const response = await partyAdapter.listRaidParties({
					raidId,
					...filters,
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
			enabled: !!raidId,
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
	list: (filters?: ExploreFilterParams) => [...partyKeys.lists(), filters] as const,
	userLists: () => [...partyKeys.all, 'user'] as const,
	userList: (username: string, params?: Omit<ListUserPartiesParams, 'username'>) =>
		[...partyKeys.userLists(), username, params] as const,
	raidLists: () => [...partyKeys.all, 'raid'] as const,
	raidList: (raidId: string, filters?: RaidPartiesFilters) =>
		[...partyKeys.raidLists(), raidId, filters] as const,
	details: () => ['party'] as const,
	detail: (shortcode: string) => [...partyKeys.details(), shortcode] as const,
	preview: (shortcode: string) => [...partyKeys.detail(shortcode), 'preview'] as const
}
