/**
 * Guidebook Mutation Configurations
 *
 * Provides mutation configurations for guidebook operations on parties
 * with cache invalidation and optimistic updates using TanStack Query v6.
 *
 * Each mutation exports both an options factory (for testing) and a hook (for components).
 *
 * @module api/mutations/guidebook
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { partyAdapter } from '$lib/api/adapters/party.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party, GuidebookList } from '$lib/types/api/party'
import type { Guidebook } from '$lib/types/api/entities'

// ============================================================================
// Options Factories
// ============================================================================

export interface UpdateGuidebookParams {
	partyId: string
	shortcode: string
	guidebookId: string
	/** The guidebook object for optimistic update */
	guidebook: Guidebook
	/** Position (1, 2, or 3) */
	position: 1 | 2 | 3
}

export interface RemoveGuidebookParams {
	partyId: string
	shortcode: string
	/** Position (1, 2, or 3) */
	position: 1 | 2 | 3
}

export function updatePartyGuidebookOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: UpdateGuidebookParams) =>
			partyAdapter.updateGuidebook(params.partyId, params.guidebookId, params.position),
		onMutate: async (params: UpdateGuidebookParams) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(params.shortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(params.shortcode))

			if (previousParty) {
				const updatedGuidebooks: GuidebookList = {
					...previousParty.guidebooks,
					[params.position]: params.guidebook
				}
				queryClient.setQueryData(partyKeys.detail(params.shortcode), {
					...previousParty,
					guidebooks: updatedGuidebooks
				})
			}

			return { previousParty }
		},
		onError: (
			_err: unknown,
			params: UpdateGuidebookParams,
			context: { previousParty?: Party } | undefined
		) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(params.shortcode), context.previousParty)
			}
		},
		onSettled: (
			_data: unknown,
			_err: unknown,
			params: UpdateGuidebookParams
		) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(params.shortcode) })
		}
	}
}

export function removePartyGuidebookOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: RemoveGuidebookParams) =>
			partyAdapter.removeGuidebook(params.partyId, params.position),
		onMutate: async (params: RemoveGuidebookParams) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(params.shortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(params.shortcode))

			if (previousParty?.guidebooks) {
				const updatedGuidebooks: GuidebookList = { ...previousParty.guidebooks }
				delete updatedGuidebooks[params.position]
				queryClient.setQueryData(partyKeys.detail(params.shortcode), {
					...previousParty,
					guidebooks: updatedGuidebooks
				})
			}

			return { previousParty }
		},
		onError: (
			_err: unknown,
			params: RemoveGuidebookParams,
			context: { previousParty?: Party } | undefined
		) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(params.shortcode), context.previousParty)
			}
		},
		onSettled: (
			_data: unknown,
			_err: unknown,
			params: RemoveGuidebookParams
		) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(params.shortcode) })
		}
	}
}

// ============================================================================
// Hooks (thin wrappers for component use)
// ============================================================================

export function useUpdatePartyGuidebook() {
	const queryClient = useQueryClient()
	return createMutation(() => updatePartyGuidebookOptions(queryClient))
}

export function useRemovePartyGuidebook() {
	const queryClient = useQueryClient()
	return createMutation(() => removePartyGuidebookOptions(queryClient))
}
