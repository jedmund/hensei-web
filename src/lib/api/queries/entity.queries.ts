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
 * // Single weapon by granblueId
 * const weapon = createQuery(() => entityQueries.weapon(granblueId))
 *
 * // Single character by granblueId
 * const character = createQuery(() => entityQueries.character(granblueId))
 * ```
 */
export const entityQueries = {
	/**
	 * Single weapon query options
	 *
	 * @param granblueId - Weapon granblueId (e.g., "1040001000")
	 * @returns Query options for fetching a single weapon
	 */
	weapon: (granblueId: string) =>
		queryOptions({
			queryKey: ['weapon', granblueId] as const,
			queryFn: () => entityAdapter.getWeapon(granblueId),
			enabled: !!granblueId,
			staleTime: 1000 * 60 * 60, // 1 hour - canonical data rarely changes
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * Single character query options
	 *
	 * @param granblueId - Character granblueId (e.g., "3040001000")
	 * @returns Query options for fetching a single character
	 */
	character: (granblueId: string) =>
		queryOptions({
			queryKey: ['character', granblueId] as const,
			queryFn: () => entityAdapter.getCharacter(granblueId),
			enabled: !!granblueId,
			staleTime: 1000 * 60 * 60, // 1 hour - canonical data rarely changes
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * Single summon query options
	 *
	 * @param granblueId - Summon granblueId (e.g., "2040001000")
	 * @returns Query options for fetching a single summon
	 */
	summon: (granblueId: string) =>
		queryOptions({
			queryKey: ['summon', granblueId] as const,
			queryFn: () => entityAdapter.getSummon(granblueId),
			enabled: !!granblueId,
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
		}),

	/**
	 * Weapon stat modifiers query options (AX skills and befoulments)
	 *
	 * @param category - Optional filter: 'ax' or 'befoulment'
	 * @returns Query options for fetching weapon stat modifiers
	 */
	weaponStatModifiers: (category?: 'ax' | 'befoulment') =>
		queryOptions({
			queryKey: ['weaponStatModifiers', category ?? 'all'] as const,
			queryFn: () => entityAdapter.getWeaponStatModifiers(category),
			staleTime: 1000 * 60 * 60, // 1 hour - reference data
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * AX skills only query options
	 *
	 * @returns Query options for fetching AX skills
	 */
	axSkills: () =>
		queryOptions({
			queryKey: ['weaponStatModifiers', 'ax'] as const,
			queryFn: () => entityAdapter.getAxSkills(),
			staleTime: 1000 * 60 * 60, // 1 hour
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	/**
	 * Befoulments only query options
	 *
	 * @returns Query options for fetching befoulments
	 */
	befoulments: () =>
		queryOptions({
			queryKey: ['weaponStatModifiers', 'befoulment'] as const,
			queryFn: () => entityAdapter.getBefoulments(),
			staleTime: 1000 * 60 * 60, // 1 hour
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		}),

	awakenings: (objectType?: string) =>
		queryOptions({
			queryKey: ['awakenings', objectType ?? 'all'] as const,
			queryFn: () => entityAdapter.getAwakenings(objectType),
			staleTime: 1000 * 60 * 60,
			gcTime: 1000 * 60 * 60 * 24
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
 * // Invalidate a specific weapon by granblueId
 * queryClient.invalidateQueries({ queryKey: entityKeys.weapon('1040001000') })
 *
 * // Invalidate all weapons
 * queryClient.invalidateQueries({ queryKey: entityKeys.weapons() })
 * ```
 */
export const entityKeys = {
	weapons: () => ['weapon'] as const,
	weapon: (granblueId: string) => [...entityKeys.weapons(), granblueId] as const,
	characters: () => ['character'] as const,
	character: (granblueId: string) => [...entityKeys.characters(), granblueId] as const,
	summons: () => ['summon'] as const,
	summon: (granblueId: string) => [...entityKeys.summons(), granblueId] as const,
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
	allSummonSeries: () => ['summonSeries'] as const,
	weaponStatModifiers: (category?: 'ax' | 'befoulment') =>
		['weaponStatModifiers', category ?? 'all'] as const,
	allWeaponStatModifiers: () => ['weaponStatModifiers'] as const,
	axSkills: () => ['weaponStatModifiers', 'ax'] as const,
	befoulments: () => ['weaponStatModifiers', 'befoulment'] as const,
	awakenings: (objectType?: string) => ['awakenings', objectType ?? 'all'] as const,
	allAwakenings: () => ['awakenings'] as const
}
