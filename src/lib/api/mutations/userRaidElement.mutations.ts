/**
 * User Raid Element Mutation Configurations
 *
 * Replacing the current user's elements for one trackable raid.
 *
 * Each mutation exports an options factory (for tests) and a hook.
 *
 * @module api/mutations/userRaidElement
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { userRaidElementAdapter } from '$lib/api/adapters/userRaidElement.adapter'
import { userRaidElementKeys } from '$lib/api/queries/userRaidElement.queries'

export interface SyncRaidElementsInput {
	raidId: string
	elements: number[]
}

export function syncRaidElementsOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ raidId, elements }: SyncRaidElementsInput) =>
			userRaidElementAdapter.sync(raidId, elements),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: userRaidElementKeys.all })
		}
	}
}

export function useSyncRaidElements() {
	const queryClient = useQueryClient()
	return createMutation(() => syncRaidElementsOptions(queryClient))
}
