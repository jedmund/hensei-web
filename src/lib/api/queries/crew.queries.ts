/**
 * Crew Query Options Factory
 *
 * Provides type-safe, reusable query configurations for crew operations
 * using TanStack Query v6 patterns.
 *
 * @module api/queries/crew
 */

import { queryOptions } from '@tanstack/svelte-query'
import { crewAdapter } from '$lib/api/adapters/crew.adapter'
import type { MemberFilter } from '$lib/types/api/crew'

/**
 * Crew query options factory
 *
 * @example
 * ```typescript
 * import { createQuery } from '@tanstack/svelte-query'
 * import { crewQueries } from '$lib/api/queries/crew.queries'
 *
 * // Current user's crew
 * const crew = createQuery(() => crewQueries.myCrew())
 *
 * // Crew members
 * const members = createQuery(() => crewQueries.members('active'))
 *
 * // Pending invitations
 * const invitations = createQuery(() => crewQueries.pendingInvitations())
 * ```
 */
export const crewQueries = {
  /**
   * Current user's crew query options
   */
  myCrew: () =>
    queryOptions({
      queryKey: ['crew', 'my'] as const,
      queryFn: () => crewAdapter.getMyCrew(),
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error) => {
        // Don't retry on 404 (no crew)
        if (error && 'status' in error && error.status === 404) {
          return false
        }
        return failureCount < 3
      }
    }),

  /**
   * Crew members query options
   *
   * @param filter - 'active' (default), 'retired', 'phantom', 'all'
   */
  members: (filter: MemberFilter = 'active') =>
    queryOptions({
      queryKey: ['crew', 'members', filter] as const,
      queryFn: () => crewAdapter.getMembers(filter),
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 15 // 15 minutes
    }),

  /**
   * Crew's sent invitations query options
   *
   * @param crewId - Crew ID
   */
  crewInvitations: (crewId: string) =>
    queryOptions({
      queryKey: ['crew', crewId, 'invitations'] as const,
      queryFn: () => crewAdapter.getCrewInvitations(crewId),
      enabled: !!crewId,
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 15 // 15 minutes
    }),

  /**
   * Current user's pending invitations query options
   */
  pendingInvitations: () =>
    queryOptions({
      queryKey: ['invitations', 'pending'] as const,
      queryFn: () => crewAdapter.getPendingInvitations(),
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 15 // 15 minutes
    }),

  /**
   * Current user's pending phantom claims query options
   * Returns phantoms assigned to the user that need to be accepted or declined
   */
  pendingPhantomClaims: () =>
    queryOptions({
      queryKey: ['phantom_claims', 'pending'] as const,
      queryFn: () => crewAdapter.getPendingPhantomClaims(),
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 15 // 15 minutes
    })
}

/**
 * Query key helpers for cache invalidation
 *
 * @example
 * ```typescript
 * import { useQueryClient } from '@tanstack/svelte-query'
 * import { crewKeys } from '$lib/api/queries/crew.queries'
 *
 * const queryClient = useQueryClient()
 *
 * // Invalidate current crew
 * queryClient.invalidateQueries({ queryKey: crewKeys.myCrew() })
 *
 * // Invalidate all member queries
 * queryClient.invalidateQueries({ queryKey: crewKeys.membersAll() })
 * ```
 */
export const crewKeys = {
  all: ['crew'] as const,
  myCrew: () => [...crewKeys.all, 'my'] as const,
  membersAll: () => [...crewKeys.all, 'members'] as const,
  members: (filter: MemberFilter) => [...crewKeys.all, 'members', filter] as const,
  crewInvitations: (crewId: string) => [...crewKeys.all, crewId, 'invitations'] as const,
  invitations: {
    all: ['invitations'] as const,
    pending: () => ['invitations', 'pending'] as const
  },
  phantomClaims: {
    all: ['phantom_claims'] as const,
    pending: () => ['phantom_claims', 'pending'] as const
  }
}
