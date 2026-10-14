/**
 * Solomonis Guidebook Mutations
 *
 * Every guidebook edit replaces the run's whole list
 * (`PUT /parties/:id/guide_effects`). The list is written to the cached party
 * straight away, then replaced with the full party the API returns. Saves for
 * one party run one at a time (see `serialSaves`). A failed save toasts from
 * here, so the error shows even when the section that made the edit is gone.
 *
 * @module api/mutations/solomonis-guidebook
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { toast } from 'svelte-sonner'
import { solomonisGuidebookAdapter } from '$lib/api/adapters/solomonis-guidebook.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import { toGuidebookInput } from '$lib/components/solomonis/guidebook/guidebook'
import type { Party } from '$lib/types/api/party'
import type { GuidebookEntry, SolomonisExpedition } from '$lib/types/api/solomonis'
import { getEditKey } from '$lib/utils/editKeys'
import { extractErrorMessage } from '$lib/utils/errors'
import * as m from '$lib/paraglide/messages'
import { hasQueuedSave, serialSaveKey, serialSaveScope } from './serialSaves'

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

export function replaceGuidebookOptions(queryClient: QueryClient, partyId?: string) {
	return {
		mutationKey: serialSaveKey('guidebook'),
		scope: serialSaveScope('guidebook', partyId),
		mutationFn: (params: ReplaceGuidebookParams) =>
			solomonisGuidebookAdapter.replaceGuidebook(
				params.partyId,
				toGuidebookInput(params.entries),
				editKeyHeaders(params.shortcode)
			),
		// Runs as soon as the save is queued, so the snapshot may hold the
		// optimistic list of a save still ahead of it.
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
		onSuccess: (party: Party, params: ReplaceGuidebookParams) => {
			// A newer list is queued: keep its optimistic write, its response follows.
			if (hasQueuedSave(queryClient, 'guidebook', params.partyId)) return
			if (party) queryClient.setQueryData(partyKeys.detail(params.shortcode), party)
		},
		onError: (
			err: unknown,
			params: ReplaceGuidebookParams,
			context: ReplaceGuidebookContext | undefined
		) => {
			toast.error(extractErrorMessage(err, m.solomonis_web_guidebook_save_failed()))
			// The queued save carries a newer list and settles the cache itself.
			if (hasQueuedSave(queryClient, 'guidebook', params.partyId)) return
			const key = partyKeys.detail(params.shortcode)
			if (context?.previousParty) queryClient.setQueryData(key, context.previousParty)
			// The snapshot may be an earlier save's unconfirmed list: refetch.
			queryClient.invalidateQueries({ queryKey: key })
		}
	}
}

/** `partyId` reads the edited party's id; it scopes the saves to that party. */
export function useReplaceGuidebook(partyId: () => string | undefined) {
	const queryClient = useQueryClient()
	return createMutation(() => replaceGuidebookOptions(queryClient, partyId()))
}
