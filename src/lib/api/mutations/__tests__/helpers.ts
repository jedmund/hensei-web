/**
 * Shared test helpers for mutation tests
 *
 * Provides utilities for creating QueryClient instances,
 * seeding cache data, and reading cache state for assertions.
 */

import { QueryClient } from '@tanstack/svelte-query'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party } from '$lib/types/api/party'

/**
 * Creates a QueryClient configured for testing.
 * Disables retries and garbage collection to keep tests deterministic.
 */
export function createTestQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: Infinity },
			mutations: { retry: false }
		}
	})
}

/**
 * Seeds a party into the query cache under its shortcode key.
 */
export function seedPartyCache(queryClient: QueryClient, party: Party): void {
	queryClient.setQueryData(partyKeys.detail(party.shortcode), party)
}

/**
 * Reads the cached party for assertions.
 */
export function getCachedParty(queryClient: QueryClient, shortcode: string): Party | undefined {
	return queryClient.getQueryData<Party>(partyKeys.detail(shortcode))
}
