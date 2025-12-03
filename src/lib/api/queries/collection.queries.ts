/**
 * Collection Query Options Factory
 *
 * Provides type-safe, reusable query configurations for collection operations
 * using TanStack Query v6 patterns.
 *
 * @module api/queries/collection
 */

import { queryOptions, infiniteQueryOptions } from '@tanstack/svelte-query'
import { collectionAdapter } from '$lib/api/adapters/collection.adapter'
import type {
	CollectionCharacter,
	CollectionWeapon,
	CollectionSummon,
	CollectionFilters
} from '$lib/types/api/collection'

/**
 * Page result format for collection infinite queries
 */
export interface CollectionPageResult<T> {
	results: T[]
	page: number
	totalPages: number
	total: number
	perPage: number
}

/**
 * Initial data structure for collection infinite queries
 */
export interface CollectionInitialData<T> {
	pages: CollectionPageResult<T>[]
	pageParams: number[]
}

/**
 * Collection query options factory
 *
 * @example
 * ```typescript
 * import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
 * import { collectionQueries } from '$lib/api/queries/collection.queries'
 *
 * // Any user's collection characters (privacy enforced server-side)
 * const characters = createInfiniteQuery(() => collectionQueries.characters(userId))
 *
 * // Collected character IDs (for filtering add modal)
 * const ownedIds = createQuery(() => collectionQueries.collectedCharacterIds(userId))
 * ```
 */
export const collectionQueries = {
	/**
	 * User's collection characters with infinite scroll
	 * Works for any user - privacy is enforced server-side
	 *
	 * @param userId - The user whose collection to fetch
	 * @param filters - Optional filters for element, rarity, etc.
	 * @param enabled - Whether the query is enabled (default: true)
	 * @param initialData - Optional initial data for SSR hydration
	 */
	characters: (
		userId: string,
		filters?: CollectionFilters,
		enabled: boolean = true,
		initialData?: CollectionInitialData<CollectionCharacter>
	) =>
		infiniteQueryOptions({
			queryKey: ['collection', 'characters', userId, filters] as const,
			queryFn: async ({ pageParam }): Promise<CollectionPageResult<CollectionCharacter>> => {
				const response = await collectionAdapter.listCharacters(userId, {
					...filters,
					page: pageParam
				})
				return {
					results: response.results,
					page: pageParam,
					totalPages: response.totalPages,
					total: response.total,
					perPage: response.perPage ?? 50
				}
			},
			initialPageParam: 1,
			getNextPageParam: (lastPage) => {
				if (lastPage.page < lastPage.totalPages) {
					return lastPage.page + 1
				}
				return undefined
			},
			staleTime: 1000 * 60 * 2, // 2 minutes
			gcTime: 1000 * 60 * 15, // 15 minutes
			enabled,
			initialData
		}),

	/**
	 * User's collection weapons with infinite scroll
	 * Works for any user - privacy is enforced server-side
	 */
	weapons: (userId: string, filters?: CollectionFilters) =>
		infiniteQueryOptions({
			queryKey: ['collection', 'weapons', userId, filters] as const,
			queryFn: async ({ pageParam }): Promise<CollectionPageResult<CollectionWeapon>> => {
				const response = await collectionAdapter.listWeapons(userId, {
					...filters,
					page: pageParam
				})
				return {
					results: response.results,
					page: pageParam,
					totalPages: response.totalPages,
					total: response.total,
					perPage: response.perPage ?? 50
				}
			},
			initialPageParam: 1,
			getNextPageParam: (lastPage) => {
				if (lastPage.page < lastPage.totalPages) {
					return lastPage.page + 1
				}
				return undefined
			},
			staleTime: 1000 * 60 * 2,
			gcTime: 1000 * 60 * 15
		}),

	/**
	 * User's collection summons with infinite scroll
	 * Works for any user - privacy is enforced server-side
	 */
	summons: (userId: string, filters?: CollectionFilters) =>
		infiniteQueryOptions({
			queryKey: ['collection', 'summons', userId, filters] as const,
			queryFn: async ({ pageParam }): Promise<CollectionPageResult<CollectionSummon>> => {
				const response = await collectionAdapter.listSummons(userId, {
					...filters,
					page: pageParam
				})
				return {
					results: response.results,
					page: pageParam,
					totalPages: response.totalPages,
					total: response.total,
					perPage: response.perPage ?? 50
				}
			},
			initialPageParam: 1,
			getNextPageParam: (lastPage) => {
				if (lastPage.page < lastPage.totalPages) {
					return lastPage.page + 1
				}
				return undefined
			},
			staleTime: 1000 * 60 * 2,
			gcTime: 1000 * 60 * 15
		}),

	/**
	 * Get IDs of characters already in a user's collection
	 * Used to filter out owned characters in the add modal
	 *
	 * @param userId - The user whose collection to fetch
	 * @param enabled - Whether the query is enabled (default: true)
	 */
	collectedCharacterIds: (userId: string, enabled: boolean = true) =>
		queryOptions({
			queryKey: ['collection', 'characters', 'ids', userId] as const,
			queryFn: () => collectionAdapter.getCollectedCharacterIds(userId),
			enabled: !!userId && enabled,
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 30 // 30 minutes
		}),

	/**
	 * Single collection character by ID
	 */
	character: (id: string) =>
		queryOptions({
			queryKey: ['collection', 'character', id] as const,
			queryFn: () => collectionAdapter.getCharacter(id),
			enabled: !!id,
			staleTime: 1000 * 60 * 5,
			gcTime: 1000 * 60 * 30
		})
}

/**
 * Query key helpers for cache invalidation
 *
 * @example
 * ```typescript
 * import { useQueryClient } from '@tanstack/svelte-query'
 * import { collectionKeys } from '$lib/api/queries/collection.queries'
 *
 * const queryClient = useQueryClient()
 *
 * // Invalidate all collection data
 * queryClient.invalidateQueries({ queryKey: collectionKeys.all })
 *
 * // Invalidate only characters for a user
 * queryClient.invalidateQueries({ queryKey: collectionKeys.characters(userId) })
 * ```
 */
export const collectionKeys = {
	all: ['collection'] as const,
	characters: (userId?: string) =>
		userId
			? ([...collectionKeys.all, 'characters', userId] as const)
			: ([...collectionKeys.all, 'characters'] as const),
	characterList: (userId: string, filters?: CollectionFilters) =>
		[...collectionKeys.characters(userId), filters] as const,
	character: (id: string) => [...collectionKeys.all, 'character', id] as const,
	characterIds: (userId?: string) =>
		userId
			? ([...collectionKeys.all, 'characters', 'ids', userId] as const)
			: ([...collectionKeys.all, 'characters', 'ids'] as const),
	weapons: (userId?: string) =>
		userId
			? ([...collectionKeys.all, 'weapons', userId] as const)
			: ([...collectionKeys.all, 'weapons'] as const),
	weaponList: (userId: string, filters?: CollectionFilters) =>
		[...collectionKeys.weapons(userId), filters] as const,
	summons: (userId?: string) =>
		userId
			? ([...collectionKeys.all, 'summons', userId] as const)
			: ([...collectionKeys.all, 'summons'] as const),
	summonList: (userId: string, filters?: CollectionFilters) =>
		[...collectionKeys.summons(userId), filters] as const
}
