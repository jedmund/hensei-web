/**
 * Entity Query Options Factory
 *
 * Provides type-safe, reusable query configurations for entity (weapon, character, summon) operations
 * using TanStack Query v6 patterns.
 *
 * @module api/queries/entity
 */

import { queryOptions } from '@tanstack/svelte-query'
import { entityAdapter } from '$lib/api/adapters/entity.adapter'

/**
 * Entity query options factory
 *
 * Provides query configurations for all entity-related operations.
 * These can be used with `createQuery` or for prefetching.
 *
 * @example
 * ```typescript
 * import { createQuery } from '@tanstack/svelte-query'
 * import { entityQueries } from '$lib/api/queries/entity.queries'
 *
 * // Single weapon by ID
 * const weapon = createQuery(() => entityQueries.weapon(id))
 *
 * // Single character by ID
 * const character = createQuery(() => entityQueries.character(id))
 * ```
 */
export const entityQueries = {
	/**
	 * Single weapon query options
	 *
	 * @param id - Weapon ID
	 * @returns Query options for fetching a single weapon
	 */
	weapon: (id: string) =>
		queryOptions({
			queryKey: ['weapon', id] as const,
			queryFn: () => entityAdapter.getWeapon(id),
			enabled: !!id,
			staleTime: 1000 * 60 * 60, // 1 hour - canonical data rarely changes
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * Single character query options
	 *
	 * @param id - Character ID
	 * @returns Query options for fetching a single character
	 */
	character: (id: string) =>
		queryOptions({
			queryKey: ['character', id] as const,
			queryFn: () => entityAdapter.getCharacter(id),
			enabled: !!id,
			staleTime: 1000 * 60 * 60, // 1 hour - canonical data rarely changes
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * Single summon query options
	 *
	 * @param id - Summon ID
	 * @returns Query options for fetching a single summon
	 */
	summon: (id: string) =>
		queryOptions({
			queryKey: ['summon', id] as const,
			queryFn: () => entityAdapter.getSummon(id),
			enabled: !!id,
			staleTime: 1000 * 60 * 60, // 1 hour - canonical data rarely changes
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		})
}

/**
 * Query key helpers for cache invalidation
 *
 * @example
 * ```typescript
 * import { useQueryClient } from '@tanstack/svelte-query'
 * import { entityKeys } from '$lib/api/queries/entity.queries'
 *
 * const queryClient = useQueryClient()
 *
 * // Invalidate a specific weapon
 * queryClient.invalidateQueries({ queryKey: entityKeys.weapon('abc123') })
 *
 * // Invalidate all weapons
 * queryClient.invalidateQueries({ queryKey: entityKeys.weapons() })
 * ```
 */
export const entityKeys = {
	weapons: () => ['weapon'] as const,
	weapon: (id: string) => [...entityKeys.weapons(), id] as const,
	characters: () => ['character'] as const,
	character: (id: string) => [...entityKeys.characters(), id] as const,
	summons: () => ['summon'] as const,
	summon: (id: string) => [...entityKeys.summons(), id] as const
}
