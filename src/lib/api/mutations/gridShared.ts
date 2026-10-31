/**
 * Shared helpers for the grid mutation modules.
 *
 * @module api/mutations/gridShared
 */

import type { QueryClient } from '@tanstack/svelte-query'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party } from '$lib/types/api/party'
import { getEditKey } from '$lib/utils/editKeys'

export function editKeyHeaders(partyShortcode: string): Record<string, string> | undefined {
	const editKey = getEditKey(partyShortcode)
	return editKey ? { 'X-Edit-Key': editKey } : undefined
}

// ============================================================================
// Shared optimistic update helpers
// ============================================================================

export function optimisticRollback(
	queryClient: QueryClient,
	partyShortcode: string,
	context: { previousParty?: Party } | undefined
) {
	if (context?.previousParty) {
		queryClient.setQueryData(partyKeys.detail(partyShortcode), context.previousParty)
	}
}

export function invalidateOnSettled(queryClient: QueryClient, partyShortcode: string) {
	queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
}
