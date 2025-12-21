/**
 * Raid Query Options Factory
 *
 * Provides type-safe, reusable query configurations for raid operations
 * using TanStack Query v6 patterns.
 *
 * @module api/queries/raid
 */

import { queryOptions } from '@tanstack/svelte-query'
import { raidAdapter } from '$lib/api/adapters/raid.adapter'
import type { RaidFull, RaidGroupFull } from '$lib/types/api/raid'

/**
 * Raid query options factory
 *
 * Provides query configurations for all raid-related operations.
 *
 * @example
 * ```typescript
 * import { createQuery } from '@tanstack/svelte-query'
 * import { raidQueries } from '$lib/api/queries/raid.queries'
 *
 * // All raid groups with their raids
 * const groups = createQuery(() => raidQueries.groups())
 *
 * // Single raid by slug
 * const raid = createQuery(() => raidQueries.bySlug('proto-bahamut'))
 * ```
 */
export const raidQueries = {
	/**
	 * All raid groups with their raids
	 *
	 * @returns Query options for fetching all raid groups
	 */
	groups: () =>
		queryOptions({
			queryKey: ['raids', 'groups'] as const,
			queryFn: () => raidAdapter.getGroups(),
			staleTime: 1000 * 60 * 60, // 1 hour - raid data rarely changes
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * Single raid by slug
	 *
	 * @param slug - Raid slug
	 * @returns Query options for fetching a single raid
	 */
	bySlug: (slug: string) =>
		queryOptions({
			queryKey: ['raids', slug] as const,
			queryFn: () => raidAdapter.getBySlug(slug),
			enabled: !!slug,
			staleTime: 1000 * 60 * 60, // 1 hour
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		})
}

/**
 * Query key helpers for cache invalidation
 */
export const raidKeys = {
	all: ['raids'] as const,
	groups: () => [...raidKeys.all, 'groups'] as const,
	detail: (slug: string) => [...raidKeys.all, slug] as const
}
