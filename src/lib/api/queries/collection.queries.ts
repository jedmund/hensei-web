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
 * Collection query options factory
 *
 * @example
 * ```typescript
 * import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
 * import { collectionQueries } from '$lib/api/queries/collection.queries'
 *
 * // Own collection characters
 * const characters = createInfiniteQuery(() => collectionQueries.characters())
 *
 * // Public collection
 * const publicChars = createQuery(() => collectionQueries.publicCharacters(userId))
 *
 * // Collected character IDs (for filtering add modal)
 * const ownedIds = createQuery(() => collectionQueries.collectedCharacterIds())
 * ```
 */
export const collectionQueries = {
	/**
	 * Current user's collection characters with infinite scroll
	 */
	characters: (filters?: CollectionFilters) =>
		infiniteQueryOptions({
			queryKey: ['collection', 'characters', filters] as const,
			queryFn: async ({ pageParam }): Promise<CollectionPageResult<CollectionCharacter>> => {
				const response = await collectionAdapter.listCharacters({
					...filters,
					page: pageParam
				})
				return {
					results: response.results,
					page: response.page,
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
			gcTime: 1000 * 60 * 15 // 15 minutes
		}),

	/**
	 * Current user's collection weapons with infinite scroll
	 */
	weapons: (filters?: CollectionFilters) =>
		infiniteQueryOptions({
			queryKey: ['collection', 'weapons', filters] as const,
			queryFn: async ({ pageParam }): Promise<CollectionPageResult<CollectionWeapon>> => {
				const response = await collectionAdapter.listWeapons({
					...filters,
					page: pageParam
				})
				return {
					results: response.results,
					page: response.page,
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
	 * Current user's collection summons with infinite scroll
	 */
	summons: (filters?: CollectionFilters) =>
		infiniteQueryOptions({
			queryKey: ['collection', 'summons', filters] as const,
			queryFn: async ({ pageParam }): Promise<CollectionPageResult<CollectionSummon>> => {
				const response = await collectionAdapter.listSummons({
					...filters,
					page: pageParam
				})
				return {
					results: response.results,
					page: response.page,
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
	 * Get IDs of characters already in the user's collection
	 * Used to filter out owned characters in the add modal
	 */
	collectedCharacterIds: () =>
		queryOptions({
			queryKey: ['collection', 'characters', 'ids'] as const,
			queryFn: () => collectionAdapter.getCollectedCharacterIds(),
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
		}),

	/**
	 * Public collection for a user (respects privacy)
	 */
	publicCharacters: (userId: string) =>
		queryOptions({
			queryKey: ['collection', 'public', userId, 'characters'] as const,
			queryFn: () => collectionAdapter.getPublicCharacters(userId),
			enabled: !!userId,
			staleTime: 1000 * 60 * 5,
			gcTime: 1000 * 60 * 30
		}),

	/**
	 * Public weapon collection for a user
	 */
	publicWeapons: (userId: string) =>
		queryOptions({
			queryKey: ['collection', 'public', userId, 'weapons'] as const,
			queryFn: () => collectionAdapter.getPublicWeapons(userId),
			enabled: !!userId,
			staleTime: 1000 * 60 * 5,
			gcTime: 1000 * 60 * 30
		}),

	/**
	 * Public summon collection for a user
	 */
	publicSummons: (userId: string) =>
		queryOptions({
			queryKey: ['collection', 'public', userId, 'summons'] as const,
			queryFn: () => collectionAdapter.getPublicSummons(userId),
			enabled: !!userId,
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
 * // Invalidate only characters
 * queryClient.invalidateQueries({ queryKey: collectionKeys.characters() })
 * ```
 */
export const collectionKeys = {
	all: ['collection'] as const,
	characters: () => [...collectionKeys.all, 'characters'] as const,
	characterList: (filters?: CollectionFilters) =>
		[...collectionKeys.characters(), filters] as const,
	character: (id: string) => [...collectionKeys.all, 'character', id] as const,
	characterIds: () => [...collectionKeys.characters(), 'ids'] as const,
	weapons: () => [...collectionKeys.all, 'weapons'] as const,
	weaponList: (filters?: CollectionFilters) => [...collectionKeys.weapons(), filters] as const,
	summons: () => [...collectionKeys.all, 'summons'] as const,
	summonList: (filters?: CollectionFilters) => [...collectionKeys.summons(), filters] as const,
	public: (userId: string) => [...collectionKeys.all, 'public', userId] as const,
	publicCharacters: (userId: string) =>
		[...collectionKeys.public(userId), 'characters'] as const,
	publicWeapons: (userId: string) => [...collectionKeys.public(userId), 'weapons'] as const,
	publicSummons: (userId: string) => [...collectionKeys.public(userId), 'summons'] as const
}
