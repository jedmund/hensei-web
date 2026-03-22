/**
 * Crew Query Options Factory
 *
 * Provides type-safe, reusable query configurations for crew operations
 * using TanStack Query v6 patterns.
 *
 * @module api/queries/crew
 */

import { queryOptions, infiniteQueryOptions } from '@tanstack/svelte-query'
import { crewAdapter } from '$lib/api/adapters/crew.adapter'
import { userAdapter } from '$lib/api/adapters/user.adapter'
import type { MemberFilter } from '$lib/types/api/crew'
// Collection privacy values from the API (1-based, matching Rails enum)
const COLLECTION_PRIVACY_PRIVATE = 3

/**
 * A crew member whose collection is accessible to the current user
 */
export interface AccessibleCollectionMember {
  userId: string
  username: string
  avatarPicture?: string
}

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
    }),

  /**
   * Parties shared with the crew query options
   * Uses infinite query for pagination
   */
  sharedParties: () =>
    infiniteQueryOptions({
      queryKey: ['crew', 'shared_parties'] as const,
      queryFn: async ({ pageParam }) => {
        const response = await crewAdapter.getSharedParties(pageParam)
        return {
          parties: response.parties,
          page: response.meta.page,
          totalPages: response.meta.totalPages,
          total: response.meta.count,
          perPage: response.meta.perPage
        }
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 15 // 15 minutes
    }),

  /**
   * Crew members with accessible collections (Everyone or CrewOnly privacy).
   * Fetches active members, checks each member's collection privacy in parallel,
   * and returns only those whose collections are viewable.
   */
  accessibleCollectionMembers: () =>
    queryOptions<AccessibleCollectionMember[]>({
      queryKey: ['crew', 'members', 'accessible-collections'] as const,
      queryFn: async () => {
        const { members } = await crewAdapter.getMembers('active')

        const memberInfos = await Promise.all(
          members
            .filter((m) => m.user)
            .map(async (m) => {
              try {
                const info = await userAdapter.getInfo(m.user!.username)
                return {
                  userId: m.user!.id,
                  username: m.user!.username,
                  avatarPicture: m.user!.avatar?.picture,
                  collectionPrivacy: info.collectionPrivacy ?? COLLECTION_PRIVACY_PRIVATE
                }
              } catch {
                return null
              }
            })
        )

        return memberInfos.filter(
          (m): m is NonNullable<typeof m> =>
            m !== null && m.collectionPrivacy !== COLLECTION_PRIVACY_PRIVATE
        )
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30 // 30 minutes
    }),

  /**
   * List all saved rosters for the crew
   */
  crewRosters: () =>
    queryOptions({
      queryKey: ['crew', 'rosters'] as const,
      queryFn: () => crewAdapter.getCrewRosters(),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30
    }),

  /**
   * Get a single roster with member ownership data
   */
  crewRoster: (rosterId: string) =>
    queryOptions({
      queryKey: ['crew', 'rosters', rosterId] as const,
      queryFn: () => crewAdapter.getCrewRoster(rosterId),
      enabled: !!rosterId,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 15
    }),

  /**
   * Crew roster query options (legacy inline roster)
   * Returns ownership info for specified items across all active crew members
   */
  roster: (characterIds: string[], weaponIds: string[], summonIds: string[]) =>
    queryOptions({
      queryKey: ['crew', 'roster', { characterIds, weaponIds, summonIds }] as const,
      queryFn: () => crewAdapter.getRoster({ characterIds, weaponIds, summonIds }),
      enabled: characterIds.length + weaponIds.length + summonIds.length > 0,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 15
    }),

  checkGamertag: (gamertag: string) =>
    queryOptions({
      queryKey: ['crew', 'check', 'gamertag', gamertag] as const,
      queryFn: () => crewAdapter.checkGametagAvailability(gamertag),
      enabled: gamertag.length >= 1,
      staleTime: 1000 * 30, // 30 seconds - availability can change
      gcTime: 1000 * 60 * 5 // 5 minutes
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
  sharedParties: () => [...crewKeys.all, 'shared_parties'] as const,
  accessibleCollectionMembers: () => [...crewKeys.all, 'members', 'accessible-collections'] as const,
  crewRosters: () => [...crewKeys.all, 'rosters'] as const,
  crewRoster: (rosterId: string) => [...crewKeys.all, 'rosters', rosterId] as const,
  roster: (characterIds: string[], weaponIds: string[], summonIds: string[]) =>
    [...crewKeys.all, 'roster', { characterIds, weaponIds, summonIds }] as const,
  checkGamertag: (gamertag: string) => [...crewKeys.all, 'check', 'gamertag', gamertag] as const,
  invitations: {
    all: ['invitations'] as const,
    pending: () => ['invitations', 'pending'] as const
  },
  phantomClaims: {
    all: ['phantom_claims'] as const,
    pending: () => ['phantom_claims', 'pending'] as const
  }
}
