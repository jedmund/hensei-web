/**
 * Evoking Solomonis grid mutations (web-grid lane).
 *
 * Seal state and `brought_by_blessing` use the existing grid item mutations;
 * this file covers the build's unseal priority list.
 */
import { createMutation, useQueryClient, type QueryClient } from '@tanstack/svelte-query'
import { solomonisGridAdapter } from '$lib/api/adapters/solomonis-grid.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import { applyPriorities } from '$lib/components/solomonis/grid/seal'
import type { Party } from '$lib/types/api/party'
import type { UnsealPriorityItem } from '$lib/types/api/solomonis'
import { getEditKey } from '$lib/utils/editKeys'

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

export function updateUnsealPriorityOptions(queryClient: QueryClient) {
	return {
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
		onSuccess: (party: Party, { partyShortcode }: UpdateUnsealPriorityVars) => {
			// The API returns the full party (D11); take it whole.
			queryClient.setQueryData(partyKeys.detail(partyShortcode), party)
		},
		onError: (
			_err: unknown,
			{ partyShortcode }: UpdateUnsealPriorityVars,
			context: MutationContext | undefined
		) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(partyShortcode), context.previousParty)
			}
		},
		onSettled: (_data: unknown, _err: unknown, { partyShortcode }: UpdateUnsealPriorityVars) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}
}

export function useUpdateUnsealPriority() {
	const queryClient = useQueryClient()
	return createMutation(() => updateUnsealPriorityOptions(queryClient))
}
