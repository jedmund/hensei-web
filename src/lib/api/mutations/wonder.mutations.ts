/**
 * Wonder mutations: the current user's collection (add, edit, remove,
 * import) and a party's Wonders. Each exports an options factory (for
 * tests) and a hook (for components).
 *
 * @module api/mutations/wonder
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { toast } from 'svelte-sonner'
import { wonderAdapter } from '$lib/api/adapters/wonder.adapter'
import { wonderKeys } from '$lib/api/queries/wonder.queries'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party } from '$lib/types/api/party'
import type {
	CollectionWonderInput,
	CollectionWonderUpdate,
	OwnedWonder,
	PartyWonderInput
} from '$lib/types/api/wonder'
import { editKeyHeaders } from './gridShared'
import { extractErrorMessage } from '$lib/utils/errors'
import { m } from '$lib/paraglide/messages'
import { hasQueuedSave, serialSaveKey, serialSaveScope } from './serialSaves'

// ============================================================================
// Collection
// ============================================================================

function invalidateCollection(queryClient: QueryClient) {
	queryClient.invalidateQueries({ queryKey: wonderKeys.collectionBase })
}

export function addCollectionWonderOptions(queryClient: QueryClient) {
	return {
		mutationFn: (input: CollectionWonderInput) => wonderAdapter.addToCollection(input),
		onSettled: () => invalidateCollection(queryClient)
	}
}

export function updateCollectionWonderOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, input }: { id: string; input: CollectionWonderUpdate }) =>
			wonderAdapter.updateInCollection(id, input),
		onSettled: () => invalidateCollection(queryClient)
	}
}

export function removeCollectionWonderOptions(queryClient: QueryClient) {
	return {
		mutationFn: (id: string) => wonderAdapter.removeFromCollection(id),
		onSettled: () => invalidateCollection(queryClient)
	}
}

export interface ImportWondersParams {
	data: unknown[]
	lang?: 'en' | 'ja'
}

export function importCollectionWondersOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ data, lang }: ImportWondersParams) => wonderAdapter.importCollection(data, lang),
		onSettled: () => invalidateCollection(queryClient)
	}
}

export function useAddCollectionWonder() {
	const queryClient = useQueryClient()
	return createMutation(() => addCollectionWonderOptions(queryClient))
}

export function useUpdateCollectionWonder() {
	const queryClient = useQueryClient()
	return createMutation(() => updateCollectionWonderOptions(queryClient))
}

export function useRemoveCollectionWonder() {
	const queryClient = useQueryClient()
	return createMutation(() => removeCollectionWonderOptions(queryClient))
}

export function useImportCollectionWonders() {
	const queryClient = useQueryClient()
	return createMutation(() => importCollectionWondersOptions(queryClient))
}

// ============================================================================
// Party
// ============================================================================

export interface UpdatePartyWondersParams {
	partyId: string
	shortcode: string
	wonders: PartyWonderInput[]
}

/** The PUT returns only the Wonders; write that one field into the party. */
function setPartyWonders(queryClient: QueryClient, shortcode: string, wonders: OwnedWonder[]) {
	queryClient.setQueryData(partyKeys.detail(shortcode), (old: Party | undefined) =>
		old ? { ...old, wonders } : old
	)
}

export function updatePartyWondersOptions(queryClient: QueryClient, partyId?: string) {
	return {
		mutationKey: serialSaveKey('wonders'),
		// Each save sends the whole set: run one party's saves in order.
		scope: serialSaveScope('wonders', partyId),
		mutationFn: (params: UpdatePartyWondersParams) =>
			wonderAdapter.updatePartyWonders(
				params.partyId,
				params.wonders,
				editKeyHeaders(params.shortcode)
			),
		onMutate: async (params: UpdatePartyWondersParams) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(params.shortcode) })
		},
		onSuccess: (data: OwnedWonder[], params: UpdatePartyWondersParams) => {
			if (hasQueuedSave(queryClient, 'wonders', params.partyId)) return
			setPartyWonders(queryClient, params.shortcode, data)
		},
		// Toasts here, so the error shows even when the pane that saved is gone.
		onError: (err: unknown) => {
			toast.error(extractErrorMessage(err, m.wonders_party_save_failed()))
		},
		onSettled: (_data: unknown, _err: unknown, params: UpdatePartyWondersParams) => {
			if (hasQueuedSave(queryClient, 'wonders', params.partyId)) return
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(params.shortcode) })
		}
	}
}

/** `partyId` reads the edited party's id; it scopes the saves to that party. */
export function useUpdatePartyWonders(partyId: () => string | undefined) {
	const queryClient = useQueryClient()
	return createMutation(() => updatePartyWondersOptions(queryClient, partyId()))
}
