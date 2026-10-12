/**
 * Evoking Solomonis party mutations: expedition fields and the blessing
 * loadout. Both write the server's answer straight into the party cache.
 *
 * @module api/mutations/solomonis
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { solomonisAdapter } from '$lib/api/adapters/solomonis.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party } from '$lib/types/api/party'
import type { SolomonisExpedition, SolomonisExpeditionInput } from '$lib/types/api/solomonis'
import { getEditKey } from '$lib/utils/editKeys'

function editKeyHeaders(shortcode: string): Record<string, string> | undefined {
	const editKey = getEditKey(shortcode)
	return editKey ? { 'X-Edit-Key': editKey } : undefined
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
			// The route Evoker can move the party's raid and element, so take the
			// whole server response, keeping fields the update may not return.
			queryClient.setQueryData(partyKeys.detail(params.shortcode), (old: Party | undefined) =>
				old ? { ...old, ...data } : data
			)
		},
		onSettled: (_data: unknown, _err: unknown, params: UpdateExpeditionParams) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(params.shortcode) })
			queryClient.invalidateQueries({ queryKey: partyKeys.userLists() })
		}
	}
}

export function updateBlessingsOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: UpdateBlessingsParams) =>
			solomonisAdapter.updateBlessings(
				params.partyId,
				params.blessingLevelIds,
				editKeyHeaders(params.shortcode)
			),
		onSuccess: (solomonis: SolomonisExpedition, params: UpdateBlessingsParams) => {
			queryClient.setQueryData(partyKeys.detail(params.shortcode), (old: Party | undefined) =>
				old ? { ...old, solomonis } : old
			)
		},
		onSettled: (_data: unknown, _err: unknown, params: UpdateBlessingsParams) => {
			// Justice changes which weapon slots start unsealed, so refetch the grids too.
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(params.shortcode) })
		}
	}
}

export function useUpdateSolomonisExpedition() {
	const queryClient = useQueryClient()
	return createMutation(() => updateExpeditionOptions(queryClient))
}

export function useUpdatePartyBlessings() {
	const queryClient = useQueryClient()
	return createMutation(() => updateBlessingsOptions(queryClient))
}
