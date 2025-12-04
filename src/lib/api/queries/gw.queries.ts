/**
 * GW (Guild War / Unite and Fight) Query Options Factory
 *
 * Provides type-safe, reusable query configurations for GW operations
 * using TanStack Query v6 patterns.
 *
 * @module api/queries/gw
 */

import { queryOptions } from '@tanstack/svelte-query'
import { gwAdapter } from '$lib/api/adapters/gw.adapter'

/**
 * GW query options factory
 *
 * @example
 * ```typescript
 * import { createQuery } from '@tanstack/svelte-query'
 * import { gwQueries } from '$lib/api/queries/gw.queries'
 *
 * // All GW events
 * const events = createQuery(() => gwQueries.events())
 *
 * // Single event
 * const event = createQuery(() => gwQueries.event(eventId))
 *
 * // Crew's participations
 * const participations = createQuery(() => gwQueries.participations())
 *
 * // Single participation with scores
 * const participation = createQuery(() => gwQueries.participation(participationId))
 * ```
 */
export const gwQueries = {
  /**
   * All GW events query options
   */
  events: () =>
    queryOptions({
      queryKey: ['gw', 'events'] as const,
      queryFn: () => gwAdapter.getEvents(),
      staleTime: 1000 * 60 * 10, // 10 minutes - events don't change often
      gcTime: 1000 * 60 * 60 // 1 hour
    }),

  /**
   * Single GW event query options
   *
   * @param eventId - Event ID
   */
  event: (eventId: string) =>
    queryOptions({
      queryKey: ['gw', 'events', eventId] as const,
      queryFn: () => gwAdapter.getEvent(eventId),
      enabled: !!eventId,
      staleTime: 1000 * 60 * 10, // 10 minutes
      gcTime: 1000 * 60 * 60 // 1 hour
    }),

  /**
   * Crew's GW participations query options
   */
  participations: () =>
    queryOptions({
      queryKey: ['gw', 'participations'] as const,
      queryFn: () => gwAdapter.getParticipations(),
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30 // 30 minutes
    }),

  /**
   * Single participation with scores query options
   *
   * @param participationId - Participation ID
   */
  participation: (participationId: string) =>
    queryOptions({
      queryKey: ['gw', 'participations', participationId] as const,
      queryFn: () => gwAdapter.getParticipation(participationId),
      enabled: !!participationId,
      staleTime: 1000 * 60 * 2, // 2 minutes - scores change during event
      gcTime: 1000 * 60 * 15 // 15 minutes
    })
}

/**
 * Query key helpers for cache invalidation
 *
 * @example
 * ```typescript
 * import { useQueryClient } from '@tanstack/svelte-query'
 * import { gwKeys } from '$lib/api/queries/gw.queries'
 *
 * const queryClient = useQueryClient()
 *
 * // Invalidate all events
 * queryClient.invalidateQueries({ queryKey: gwKeys.events() })
 *
 * // Invalidate a specific participation
 * queryClient.invalidateQueries({ queryKey: gwKeys.participation(participationId) })
 * ```
 */
export const gwKeys = {
  all: ['gw'] as const,
  events: () => [...gwKeys.all, 'events'] as const,
  event: (eventId: string) => [...gwKeys.all, 'events', eventId] as const,
  participationsAll: () => [...gwKeys.all, 'participations'] as const,
  participation: (participationId: string) => [...gwKeys.all, 'participations', participationId] as const
}
