/**
 * Evoking Solomonis party mutations: expedition fields and the blessing
 * loadout. Both write the returned party straight into the party cache.
 *
 * @module api/mutations/solomonis
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { solomonisAdapter } from '$lib/api/adapters/solomonis.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party } from '$lib/types/api/party'
import type { SolomonisExpeditionInput } from '$lib/types/api/solomonis'
import { getEditKey } from '$lib/utils/editKeys'

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

export function updateBlessingsOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: UpdateBlessingsParams) =>
			solomonisAdapter.updateBlessings(
				params.partyId,
				params.blessingLevelIds,
				editKeyHeaders(params.shortcode)
			),
		onSuccess: (data: Party, params: UpdateBlessingsParams) => {
			mergeParty(queryClient, params.shortcode, data)
		},
		onSettled: (_data: unknown, _err: unknown, params: UpdateBlessingsParams) => {
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
