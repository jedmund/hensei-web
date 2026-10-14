/**
 * Evoking Solomonis party mutations: expedition fields and the blessing
 * loadout. Both write the returned party straight into the party cache.
 *
 * @module api/mutations/solomonis
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { toast } from 'svelte-sonner'
import { solomonisAdapter } from '$lib/api/adapters/solomonis.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party } from '$lib/types/api/party'
import type { SolomonisExpeditionInput } from '$lib/types/api/solomonis'
import { getEditKey } from '$lib/utils/editKeys'
import { solomonisErrorMessage } from '$lib/components/solomonis/party/solomonisParty'
import * as m from '$lib/paraglide/messages'
import { hasQueuedSave, serialSaveKey, serialSaveScope } from './serialSaves'

function editKeyHeaders(shortcode: string): Record<string, string> | undefined {
	const editKey = getEditKey(shortcode)
	return editKey ? { 'X-Edit-Key': editKey } : undefined
}

/**
 * Every Solomonis write returns the full party (D11): the route Evoker moves
 * the raid and element, and Justice changes the starting slots. Keep fields
 * the write may not return (e.g. favorited).
 */
function mergeParty(queryClient: QueryClient, shortcode: string, data: Party) {
	queryClient.setQueryData(partyKeys.detail(shortcode), (old: Party | undefined) =>
		old ? { ...old, ...data } : data
	)
}

export interface UpdateExpeditionParams {
	partyId: string
	shortcode: string
	solomonis: SolomonisExpeditionInput
}

export interface UpdateBlessingsParams {
	partyId: string
	shortcode: string
	blessingLevelIds: string[]
}

export function updateExpeditionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: UpdateExpeditionParams) =>
			solomonisAdapter.updateExpedition(
				params.partyId,
				params.solomonis,
				editKeyHeaders(params.shortcode)
			),
		onSuccess: (data: Party, params: UpdateExpeditionParams) => {
			mergeParty(queryClient, params.shortcode, data)
		},
		onSettled: (_data: unknown, _err: unknown, params: UpdateExpeditionParams) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(params.shortcode) })
			queryClient.invalidateQueries({ queryKey: partyKeys.userLists() })
		}
	}
}

export function updateBlessingsOptions(queryClient: QueryClient, partyId?: string) {
	return {
		mutationKey: serialSaveKey('blessings'),
		// Each save sends the whole loadout: run one party's saves in order.
		scope: serialSaveScope('blessings', partyId),
		mutationFn: (params: UpdateBlessingsParams) =>
			solomonisAdapter.updateBlessings(
				params.partyId,
				params.blessingLevelIds,
				editKeyHeaders(params.shortcode)
			),
		onMutate: async (params: UpdateBlessingsParams) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(params.shortcode) })
		},
		onSuccess: (data: Party, params: UpdateBlessingsParams) => {
			// A newer loadout is queued; its response follows.
			if (hasQueuedSave(queryClient, 'blessings', params.partyId)) return
			mergeParty(queryClient, params.shortcode, data)
		},
		// Toasts here, so the error shows even when the pane that saved is gone.
		onError: (err: unknown) => {
			toast.error(solomonisErrorMessage(err, m.solomonis_web_party_blessings_save_failed()))
		},
		onSettled: (_data: unknown, _err: unknown, params: UpdateBlessingsParams) => {
			// Only after the last queued save, so a refetch can't land on top
			// of a newer save's response with an older loadout.
			if (hasQueuedSave(queryClient, 'blessings', params.partyId)) return
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(params.shortcode) })
		}
	}
}

export function useUpdateSolomonisExpedition() {
	const queryClient = useQueryClient()
	return createMutation(() => updateExpeditionOptions(queryClient))
}

/** `partyId` reads the edited party's id; it scopes the saves to that party. */
export function useUpdatePartyBlessings(partyId: () => string | undefined) {
	const queryClient = useQueryClient()
	return createMutation(() => updateBlessingsOptions(queryClient, partyId()))
}
