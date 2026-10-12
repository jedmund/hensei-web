/**
 * Solomonis Guidebook Mutations
 *
 * Every guidebook edit replaces the run's whole list
 * (`PUT /parties/:id/guide_effects`). The list is written to the cached party
 * straight away, then replaced with the `solomonis` object the API returns.
 *
 * @module api/mutations/solomonis-guidebook
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { solomonisGuidebookAdapter } from '$lib/api/adapters/solomonis-guidebook.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import { toGuidebookInput } from '$lib/components/solomonis/guidebook/guidebook'
import type { Party } from '$lib/types/api/party'
import type { GuidebookEntry, SolomonisExpedition } from '$lib/types/api/solomonis'
import { getEditKey } from '$lib/utils/editKeys'

function editKeyHeaders(shortcode: string): Record<string, string> | undefined {
	const editKey = getEditKey(shortcode)
	return editKey ? { 'X-Edit-Key': editKey } : undefined
}

/** The full-view `solomonis` object, or null for list views and other parties. */
export function solomonisExpedition(party: Party | undefined | null): SolomonisExpedition | null {
	const solomonis = party?.solomonis
	return solomonis && 'guidebook' in solomonis ? solomonis : null
}

function withSolomonis(party: Party, solomonis: SolomonisExpedition): Party {
	return { ...party, solomonis }
}

export interface ReplaceGuidebookParams {
	partyId: string
	shortcode: string
	/** The run's complete guidebook after the edit. */
	entries: GuidebookEntry[]
}

interface ReplaceGuidebookContext {
	previousParty?: Party
}

export function replaceGuidebookOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: ReplaceGuidebookParams) =>
			solomonisGuidebookAdapter.replaceGuidebook(
				params.partyId,
				toGuidebookInput(params.entries),
				editKeyHeaders(params.shortcode)
			),
		onMutate: async (params: ReplaceGuidebookParams): Promise<ReplaceGuidebookContext> => {
			const key = partyKeys.detail(params.shortcode)
			await queryClient.cancelQueries({ queryKey: key })

			const previousParty = queryClient.getQueryData<Party>(key)
			const expedition = solomonisExpedition(previousParty)
			if (previousParty && expedition) {
				queryClient.setQueryData(
					key,
					withSolomonis(previousParty, { ...expedition, guidebook: params.entries })
				)
			}
			return { previousParty }
		},
		onSuccess: (solomonis: SolomonisExpedition, params: ReplaceGuidebookParams) => {
			const key = partyKeys.detail(params.shortcode)
			const party = queryClient.getQueryData<Party>(key)
			if (party && solomonis) {
				queryClient.setQueryData(key, withSolomonis(party, solomonis))
			}
		},
		onError: (
			_err: unknown,
			params: ReplaceGuidebookParams,
			context: ReplaceGuidebookContext | undefined
		) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(params.shortcode), context.previousParty)
			}
		}
	}
}

export function useReplaceGuidebook() {
	const queryClient = useQueryClient()
	return createMutation(() => replaceGuidebookOptions(queryClient))
}
