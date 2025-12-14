/**
 * Entity Query Options Factory
 *
 * Provides type-safe, reusable query configurations for entity (weapon, character, summon) operations
 * using TanStack Query v6 patterns.
 *
 * @module api/queries/entity
 */

import { queryOptions } from '@tanstack/svelte-query'
import { entityAdapter, type WeaponKeyQueryParams } from '$lib/api/adapters/entity.adapter'

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
		}),

	/**
	 * Weapon keys query options with optional filtering
	 *
	 * @param params - Optional filter parameters (series, slot, group)
	 * @returns Query options for fetching weapon keys
	 */
	weaponKeys: (params?: WeaponKeyQueryParams) =>
		queryOptions({
			queryKey: ['weaponKeys', params?.seriesSlug, params?.slot, params?.group] as const,
			queryFn: () => entityAdapter.getWeaponKeys(params),
			staleTime: 1000 * 60 * 60, // 1 hour - weapon keys rarely change
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * All weapon series query options
	 * Returns list ordered by display order
	 *
	 * @returns Query options for fetching all weapon series
	 */
	weaponSeriesList: () =>
		queryOptions({
			queryKey: ['weaponSeries', 'list'] as const,
			queryFn: () => entityAdapter.getWeaponSeriesList(),
			staleTime: 1000 * 60 * 60, // 1 hour - rarely changes
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * Single weapon series query options
	 *
	 * @param idOrSlug - Weapon series UUID or slug (e.g., 'dark-opus')
	 * @returns Query options for fetching a single weapon series with full details
	 */
	weaponSeries: (idOrSlug: string) =>
		queryOptions({
			queryKey: ['weaponSeries', idOrSlug] as const,
			queryFn: () => entityAdapter.getWeaponSeries(idOrSlug),
			enabled: !!idOrSlug,
			staleTime: 1000 * 60 * 60, // 1 hour
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * All character series query options
	 * Returns list ordered by display order
	 *
	 * @returns Query options for fetching all character series
	 */
	characterSeriesList: () =>
		queryOptions({
			queryKey: ['characterSeries', 'list'] as const,
			queryFn: () => entityAdapter.getCharacterSeriesList(),
			staleTime: 1000 * 60 * 60, // 1 hour - rarely changes
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * Single character series query options
	 *
	 * @param idOrSlug - Character series UUID or slug (e.g., 'grand')
	 * @returns Query options for fetching a single character series with full details
	 */
	characterSeries: (idOrSlug: string) =>
		queryOptions({
			queryKey: ['characterSeries', idOrSlug] as const,
			queryFn: () => entityAdapter.getCharacterSeries(idOrSlug),
			enabled: !!idOrSlug,
			staleTime: 1000 * 60 * 60, // 1 hour
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * All summon series query options
	 * Returns list ordered by display order
	 *
	 * @returns Query options for fetching all summon series
	 */
	summonSeriesList: () =>
		queryOptions({
			queryKey: ['summonSeries', 'list'] as const,
			queryFn: () => entityAdapter.getSummonSeriesList(),
			staleTime: 1000 * 60 * 60, // 1 hour - rarely changes
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * Single summon series query options
	 *
	 * @param idOrSlug - Summon series UUID or slug (e.g., 'magna')
	 * @returns Query options for fetching a single summon series with full details
	 */
	summonSeries: (idOrSlug: string) =>
		queryOptions({
			queryKey: ['summonSeries', idOrSlug] as const,
			queryFn: () => entityAdapter.getSummonSeries(idOrSlug),
			enabled: !!idOrSlug,
			staleTime: 1000 * 60 * 60, // 1 hour
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
	summon: (id: string) => [...entityKeys.summons(), id] as const,
	weaponKeys: (params?: WeaponKeyQueryParams) =>
		['weaponKeys', params?.seriesSlug, params?.slot, params?.group] as const,
	weaponSeriesList: () => ['weaponSeries', 'list'] as const,
	weaponSeries: (idOrSlug: string) => ['weaponSeries', idOrSlug] as const,
	allWeaponSeries: () => ['weaponSeries'] as const,
	characterSeriesList: () => ['characterSeries', 'list'] as const,
	characterSeries: (idOrSlug: string) => ['characterSeries', idOrSlug] as const,
	allCharacterSeries: () => ['characterSeries'] as const,
	summonSeriesList: () => ['summonSeries', 'list'] as const,
	summonSeries: (idOrSlug: string) => ['summonSeries', idOrSlug] as const,
	allSummonSeries: () => ['summonSeries'] as const
}
