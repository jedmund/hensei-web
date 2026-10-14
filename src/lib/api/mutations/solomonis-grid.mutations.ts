/**
 * Evoking Solomonis grid mutations (web-grid lane).
 *
 * Seal state and `brought_by_blessing` use the existing grid item mutations;
 * this file covers the party's unseal priority list.
 */
import { createMutation, useQueryClient, type QueryClient } from '@tanstack/svelte-query'
import { solomonisGridAdapter } from '$lib/api/adapters/solomonis-grid.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import { applyPriorities } from '$lib/components/solomonis/grid/seal'
import type { Party } from '$lib/types/api/party'
import type { UnsealPriorityItem } from '$lib/types/api/solomonis'
import { getEditKey } from '$lib/utils/editKeys'
import { hasQueuedSave, serialSaveKey, serialSaveScope } from './serialSaves'

export interface UpdateUnsealPriorityVars {
	partyId: string
	partyShortcode: string
	items: UnsealPriorityItem[]
}

interface MutationContext {
	previousParty?: Party
}

function editKeyHeaders(partyShortcode: string): Record<string, string> | undefined {
	const editKey = getEditKey(partyShortcode)
	return editKey ? { 'X-Edit-Key': editKey } : undefined
}

export function updateUnsealPriorityOptions(queryClient: QueryClient, partyId?: string) {
	return {
		mutationKey: serialSaveKey('unseal-priority'),
		// Each save sends the whole list: run one party's saves in order.
		scope: serialSaveScope('unseal-priority', partyId),
		mutationFn: ({ partyId, partyShortcode, items }: UpdateUnsealPriorityVars) =>
			solomonisGridAdapter.updateUnsealPriority(partyId, items, editKeyHeaders(partyShortcode)),
		onMutate: async ({ partyShortcode, items }: UpdateUnsealPriorityVars) => {
			const key = partyKeys.detail(partyShortcode)
			await queryClient.cancelQueries({ queryKey: key })
			const previousParty = queryClient.getQueryData<Party>(key)
			if (previousParty) {
				queryClient.setQueryData(key, applyPriorities(previousParty, items))
			}
			return { previousParty } satisfies MutationContext
		},
		onSuccess: (party: Party, { partyId, partyShortcode }: UpdateUnsealPriorityVars) => {
			// A newer list is queued: keep its optimistic write, its response follows.
			if (hasQueuedSave(queryClient, 'unseal-priority', partyId)) return
			// The API returns the full party (D11); take it whole.
			queryClient.setQueryData(partyKeys.detail(partyShortcode), party)
		},
		onError: (
			_err: unknown,
			{ partyId, partyShortcode }: UpdateUnsealPriorityVars,
			context: MutationContext | undefined
		) => {
			// The queued save carries a newer list and settles the cache itself.
			if (hasQueuedSave(queryClient, 'unseal-priority', partyId)) return
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(partyShortcode), context.previousParty)
			}
		},
		onSettled: (
			_data: unknown,
			_err: unknown,
			{ partyId, partyShortcode }: UpdateUnsealPriorityVars
		) => {
			// Only after the last queued save, so a refetch can't land on top
			// of a newer save's response with an older list.
			if (hasQueuedSave(queryClient, 'unseal-priority', partyId)) return
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}
}

/** `partyId` reads the edited party's id; it scopes the saves to that party. */
export function useUpdateUnsealPriority(partyId: () => string | undefined) {
	const queryClient = useQueryClient()
	return createMutation(() => updateUnsealPriorityOptions(queryClient, partyId()))
}
