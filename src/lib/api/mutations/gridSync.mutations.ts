/**
 * Grid sync mutation configurations: sync grid items from their collection
 * source, sync them back to the collection, sync the whole party and unlink it.
 *
 * Each mutation exports both an options factory (for testing) and a hook (for components).
 *
 * @module api/mutations/gridSync
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { gridAdapter } from '$lib/api/adapters/grid.adapter'
import { collectionKeys } from '$lib/api/queries/collection.queries'
import { editKeyHeaders, invalidatePartyOnSuccess } from './gridShared'

type SyncParams = { id: string; partyShortcode: string; fields?: string[] }
type PartyParams = { partyId: string; partyShortcode: string }

export function syncGridCharacterOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: SyncParams) =>
			gridAdapter.syncCharacter(params.id, editKeyHeaders(params.partyShortcode), params.fields),
		...invalidatePartyOnSuccess(queryClient)
	}
}

export function syncGridWeaponOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: SyncParams) =>
			gridAdapter.syncWeapon(params.id, editKeyHeaders(params.partyShortcode), params.fields),
		...invalidatePartyOnSuccess(queryClient)
	}
}

export function syncGridSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: SyncParams) =>
			gridAdapter.syncSummon(params.id, editKeyHeaders(params.partyShortcode), params.fields),
		...invalidatePartyOnSuccess(queryClient)
	}
}

// ============================================================================
// Sync to Collection Mutation Options
// ============================================================================

export function syncGridCharacterToCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: SyncParams) =>
			gridAdapter.syncCharacterToCollection(
				params.id,
				editKeyHeaders(params.partyShortcode),
				params.fields
			),
		...invalidatePartyOnSuccess(queryClient, [collectionKeys.characters()])
	}
}

export function syncGridWeaponToCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: SyncParams) =>
			gridAdapter.syncWeaponToCollection(
				params.id,
				editKeyHeaders(params.partyShortcode),
				params.fields
			),
		...invalidatePartyOnSuccess(queryClient, [collectionKeys.weapons()])
	}
}

export function syncGridSummonToCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: SyncParams) =>
			gridAdapter.syncSummonToCollection(
				params.id,
				editKeyHeaders(params.partyShortcode),
				params.fields
			),
		...invalidatePartyOnSuccess(queryClient, [collectionKeys.summons()])
	}
}

export function syncAllPartyItemsOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: PartyParams) =>
			gridAdapter.syncAllPartyItems(params.partyId, editKeyHeaders(params.partyShortcode)),
		...invalidatePartyOnSuccess(queryClient)
	}
}

export function unlinkCollectionSourceOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: PartyParams) =>
			gridAdapter.unlinkCollectionSource(params.partyId, editKeyHeaders(params.partyShortcode)),
		...invalidatePartyOnSuccess(queryClient)
	}
}

// ============================================================================
// Svelte Hooks (thin wrappers for component use)
// ============================================================================

export function useSyncGridCharacter() {
	const queryClient = useQueryClient()
	return createMutation(() => syncGridCharacterOptions(queryClient))
}

export function useSyncGridWeapon() {
	const queryClient = useQueryClient()
	return createMutation(() => syncGridWeaponOptions(queryClient))
}

export function useSyncGridSummon() {
	const queryClient = useQueryClient()
	return createMutation(() => syncGridSummonOptions(queryClient))
}

export function useSyncGridCharacterToCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => syncGridCharacterToCollectionOptions(queryClient))
}

export function useSyncGridWeaponToCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => syncGridWeaponToCollectionOptions(queryClient))
}

export function useSyncGridSummonToCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => syncGridSummonToCollectionOptions(queryClient))
}

export function useSyncAllPartyItems() {
	const queryClient = useQueryClient()
	return createMutation(() => syncAllPartyItemsOptions(queryClient))
}

export function useUnlinkCollectionSource() {
	const queryClient = useQueryClient()
	return createMutation(() => unlinkCollectionSourceOptions(queryClient))
}
