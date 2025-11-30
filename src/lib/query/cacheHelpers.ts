/**
 * Cache Helper Utilities
 *
 * Utilities for working with TanStack Query cache, particularly for resolving
 * party identifiers and invalidating queries correctly.
 *
 * @module query/cacheHelpers
 */

import type { QueryClient } from '@tanstack/svelte-query'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party } from '$lib/types/api/party'

/**
 * Resolves a party identifier (UUID or shortcode) to its shortcode.
 * Searches the query cache for a matching party.
 *
 * @param queryClient - The TanStack Query client
 * @param partyId - Party identifier (can be UUID or shortcode)
 * @returns The party's shortcode
 *
 * @example
 * ```typescript
 * // With shortcode (returns as-is)
 * resolvePartyShortcode(queryClient, 'abc123') // => 'abc123'
 *
 * // With UUID (searches cache)
 * resolvePartyShortcode(queryClient, '550e8400-...') // => 'abc123'
 * ```
 */
export function resolvePartyShortcode(
	queryClient: QueryClient,
	partyId: string | number
): string {
	const idStr = String(partyId)

	// If it looks like a shortcode (short alphanumeric), return as-is
	if (idStr.length < 20 && /^[a-zA-Z0-9_-]+$/.test(idStr)) {
		return idStr
	}

	// Otherwise, search cache for party with matching UUID
	const caches = queryClient.getQueryCache().getAll()

	for (const cache of caches) {
		if (cache.queryKey[0] === 'party') {
			const party = cache.state.data as Party | undefined
			if (party?.id === idStr) {
				return party.shortcode
			}
		}
	}

	// Fallback: assume it's a shortcode
	return idStr
}

/**
 * Invalidates a party query by UUID or shortcode.
 * Automatically resolves UUID to shortcode for correct cache invalidation.
 *
 * @param queryClient - The TanStack Query client
 * @param partyId - Party identifier (can be UUID or shortcode)
 *
 * @example
 * ```typescript
 * // Invalidate by shortcode
 * invalidateParty(queryClient, 'abc123')
 *
 * // Invalidate by UUID (automatically resolves to shortcode)
 * invalidateParty(queryClient, '550e8400-...')
 * ```
 */
export function invalidateParty(queryClient: QueryClient, partyId: string | number) {
	const shortcode = resolvePartyShortcode(queryClient, partyId)
	return queryClient.invalidateQueries({
		queryKey: partyKeys.detail(shortcode)
	})
}
