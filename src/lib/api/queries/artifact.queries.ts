/**
 * Artifact Query Options Factory
 *
 * Provides type-safe, reusable query configurations for artifact operations
 * using TanStack Query v6 patterns.
 *
 * @module api/queries/artifact
 */

import { queryOptions, infiniteQueryOptions } from '@tanstack/svelte-query'
import { artifactAdapter, type CollectionArtifactListParams } from '$lib/api/adapters/artifact.adapter'
import type { Artifact, ArtifactSkill, CollectionArtifact } from '$lib/types/api/artifact'

/**
 * Page result format for collection artifact infinite queries
 */
export interface ArtifactPageResult {
	results: CollectionArtifact[]
	page: number
	totalPages: number
	total: number
	perPage: number
}

/**
 * Initial data structure for collection artifact infinite queries
 */
export interface ArtifactInitialData {
	pages: ArtifactPageResult[]
	pageParams: number[]
}

/**
 * Artifact query options factory
 *
 * @example
 * ```typescript
 * import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
 * import { artifactQueries } from '$lib/api/queries/artifact.queries'
 *
 * // All artifact reference data (cached for 1 hour)
 * const artifacts = createQuery(() => artifactQueries.all())
 *
 * // All skills (cached for 1 hour)
 * const skills = createQuery(() => artifactQueries.skills())
 *
 * // Skills for a specific slot
 * const slot1Skills = createQuery(() => artifactQueries.skillsForSlot(1))
 *
 * // User's collection artifacts with infinite scroll
 * const collection = createInfiniteQuery(() => artifactQueries.collection(userId))
 * ```
 */
export const artifactQueries = {
	/**
	 * All artifact reference data (standard and quirk)
	 * Cached for 1 hour as this data rarely changes
	 */
	all: (params?: { rarity?: 'standard' | 'quirk'; proficiency?: number }) =>
		queryOptions({
			queryKey: ['artifacts', 'all', params] as const,
			queryFn: () => artifactAdapter.listArtifacts(params),
			staleTime: 1000 * 60 * 60, // 1 hour
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * Single artifact by ID
	 */
	byId: (id: string) =>
		queryOptions({
			queryKey: ['artifacts', 'detail', id] as const,
			queryFn: () => artifactAdapter.getArtifact(id),
			enabled: !!id,
			staleTime: 1000 * 60 * 60, // 1 hour
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * All artifact skills
	 * Cached for 1 hour as this data rarely changes
	 */
	skills: () =>
		queryOptions({
			queryKey: ['artifacts', 'skills', 'all'] as const,
			queryFn: () => artifactAdapter.listSkills(),
			staleTime: 1000 * 60 * 60, // 1 hour
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * Skills for a specific slot (1-4)
	 * Maps slots to skill groups:
	 * - Slots 1-2: group_i
	 * - Slot 3: group_ii
	 * - Slot 4: group_iii
	 */
	skillsForSlot: (slot: number) =>
		queryOptions({
			queryKey: ['artifacts', 'skills', 'slot', slot] as const,
			queryFn: () => artifactAdapter.getSkillsForSlot(slot),
			enabled: slot >= 1 && slot <= 4,
			staleTime: 1000 * 60 * 60, // 1 hour
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * Single artifact skill by ID
	 */
	skillById: (id: string) =>
		queryOptions({
			queryKey: ['artifacts', 'skills', 'detail', id] as const,
			queryFn: () => artifactAdapter.getSkill(id),
			enabled: !!id,
			staleTime: 1000 * 60 * 60, // 1 hour
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * User's collection artifacts with infinite scroll
	 *
	 * @param userId - The user whose collection to fetch
	 * @param filters - Optional filters for element, artifact type, etc.
	 * @param enabled - Whether the query is enabled (default: true)
	 * @param initialData - Optional initial data for SSR hydration
	 */
	collection: (
		userId: string,
		filters?: Omit<CollectionArtifactListParams, 'page' | 'limit'>,
		enabled: boolean = true,
		initialData?: ArtifactInitialData
	) =>
		infiniteQueryOptions({
			queryKey: ['collection', 'artifacts', userId, filters] as const,
			queryFn: async ({ pageParam }): Promise<ArtifactPageResult> => {
				const response = await artifactAdapter.listCollectionArtifacts(userId, {
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
			enabled: !!userId && enabled,
			initialData
		}),

	/**
	 * Single collection artifact by ID
	 */
	collectionArtifact: (id: string) =>
		queryOptions({
			queryKey: ['collection', 'artifact', id] as const,
			queryFn: () => artifactAdapter.getCollectionArtifact(id),
			enabled: !!id,
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 30 // 30 minutes
		})
}

/**
 * Query key helpers for cache invalidation
 *
 * @example
 * ```typescript
 * import { useQueryClient } from '@tanstack/svelte-query'
 * import { artifactKeys } from '$lib/api/queries/artifact.queries'
 *
 * const queryClient = useQueryClient()
 *
 * // Invalidate all artifact-related queries
 * queryClient.invalidateQueries({ queryKey: artifactKeys.all })
 *
 * // Invalidate only collection artifacts for a user
 * queryClient.invalidateQueries({ queryKey: artifactKeys.collection(userId) })
 *
 * // Invalidate reference data
 * queryClient.invalidateQueries({ queryKey: artifactKeys.reference })
 * ```
 */
export const artifactKeys = {
	/** All artifact-related queries */
	all: ['artifacts'] as const,

	/** All reference data (artifacts and skills) */
	reference: ['artifacts', 'all'] as const,

	/** Artifact list with optional filters */
	list: (params?: { rarity?: 'standard' | 'quirk'; proficiency?: number }) =>
		['artifacts', 'all', params] as const,

	/** Single artifact by ID */
	detail: (id: string) => ['artifacts', 'detail', id] as const,

	/** All skills */
	skills: ['artifacts', 'skills'] as const,

	/** Skills for a specific slot */
	skillsForSlot: (slot: number) => ['artifacts', 'skills', 'slot', slot] as const,

	/** Single skill by ID */
	skillDetail: (id: string) => ['artifacts', 'skills', 'detail', id] as const,

	/** Collection artifacts base key */
	collectionBase: ['collection', 'artifacts'] as const,

	/** Collection artifacts for a user (all pages) */
	collection: (userId?: string) =>
		userId
			? (['collection', 'artifacts', userId] as const)
			: (['collection', 'artifacts'] as const),

	/** Collection artifacts with filters */
	collectionList: (
		userId: string,
		filters?: Omit<CollectionArtifactListParams, 'page' | 'limit'>
	) => ['collection', 'artifacts', userId, filters] as const,

	/** Single collection artifact */
	collectionArtifact: (id: string) => ['collection', 'artifact', id] as const
}
