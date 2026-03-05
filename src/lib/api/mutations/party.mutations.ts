/**
 * Party Mutation Configurations
 *
 * Provides mutation configurations for party CRUD operations
 * with cache invalidation and optimistic updates using TanStack Query v6.
 *
 * Each mutation exports both an options factory (for testing) and a hook (for components).
 *
 * @module api/mutations/party
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import {
	partyAdapter,
	type CreatePartyParams,
	type UpdatePartyParams
} from '$lib/api/adapters/party.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import { userKeys } from '$lib/api/queries/user.queries'
import { crewKeys } from '$lib/api/queries/crew.queries'
import type { Party } from '$lib/types/api/party'

// ============================================================================
// Options Factories
// ============================================================================

export function createPartyOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: CreatePartyParams) => partyAdapter.create(params),
		onSuccess: (party: Party) => {
			queryClient.setQueryData(partyKeys.detail(party.shortcode), party)
			queryClient.invalidateQueries({ queryKey: partyKeys.lists() })
			queryClient.invalidateQueries({ queryKey: userKeys.all })
		}
	}
}

export function updatePartyOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: UpdatePartyParams) => partyAdapter.update(params),
		onMutate: async (params: UpdatePartyParams) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(params.shortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(params.shortcode))

			if (previousParty) {
				queryClient.setQueryData(partyKeys.detail(params.shortcode), {
					...previousParty,
					...params
				})
			}

			return { previousParty }
		},
		onError: (_err: unknown, params: UpdatePartyParams, context: { previousParty?: Party } | undefined) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(params.shortcode), context.previousParty)
			}
		},
		onSettled: (_data: unknown, _err: unknown, params: UpdatePartyParams) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(params.shortcode) })
		}
	}
}

export function deletePartyOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id: string; shortcode: string }) => partyAdapter.delete(params.id),
		onSuccess: (_data: unknown, params: { id: string; shortcode: string }) => {
			queryClient.removeQueries({ queryKey: partyKeys.detail(params.shortcode) })
			queryClient.invalidateQueries({ queryKey: partyKeys.lists() })
			queryClient.invalidateQueries({ queryKey: userKeys.all })
		}
	}
}

export function remixPartyOptions(queryClient: QueryClient) {
	return {
		mutationFn: (shortcode: string) => partyAdapter.remix(shortcode),
		onSuccess: (newParty: Party) => {
			queryClient.setQueryData(partyKeys.detail(newParty.shortcode), newParty)
			queryClient.invalidateQueries({ queryKey: partyKeys.lists() })
			queryClient.invalidateQueries({ queryKey: userKeys.all })
		}
	}
}

export function favoritePartyOptions(queryClient: QueryClient) {
	return {
		mutationFn: (shortcode: string) => partyAdapter.favorite(shortcode),
		onMutate: async (shortcode: string) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(shortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(shortcode))

			if (previousParty) {
				queryClient.setQueryData(partyKeys.detail(shortcode), {
					...previousParty,
					favorited: true
				})
			}

			return { previousParty }
		},
		onError: (_err: unknown, shortcode: string, context: { previousParty?: Party } | undefined) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(shortcode), context.previousParty)
			}
		},
		onSettled: (_data: unknown, _err: unknown, shortcode: string) => {
			queryClient.invalidateQueries({ queryKey: userKeys.favorites() })
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
		}
	}
}

export function unfavoritePartyOptions(queryClient: QueryClient) {
	return {
		mutationFn: (shortcode: string) => partyAdapter.unfavorite(shortcode),
		onMutate: async (shortcode: string) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(shortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(shortcode))

			if (previousParty) {
				queryClient.setQueryData(partyKeys.detail(shortcode), {
					...previousParty,
					favorited: false
				})
			}

			return { previousParty }
		},
		onError: (_err: unknown, shortcode: string, context: { previousParty?: Party } | undefined) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(shortcode), context.previousParty)
			}
		},
		onSettled: (_data: unknown, _err: unknown, shortcode: string) => {
			queryClient.invalidateQueries({ queryKey: userKeys.favorites() })
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
		}
	}
}

export function regeneratePreviewOptions(queryClient: QueryClient) {
	return {
		mutationFn: (shortcode: string) => partyAdapter.regeneratePreview(shortcode),
		onSuccess: (_data: unknown, shortcode: string) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.preview(shortcode) })
		}
	}
}

export function sharePartyWithCrewOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ partyId }: { partyId: string; shortcode: string }) =>
			partyAdapter.shareWithCrew(partyId),
		onSuccess: (_share: unknown, { shortcode }: { partyId: string; shortcode: string }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
			queryClient.invalidateQueries({ queryKey: crewKeys.sharedParties() })
		}
	}
}

export function removePartyShareOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ partyId, shareId }: { partyId: string; shareId: string; shortcode: string }) =>
			partyAdapter.removeShare(partyId, shareId),
		onSuccess: (_data: unknown, { shortcode }: { partyId: string; shareId: string; shortcode: string }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
			queryClient.invalidateQueries({ queryKey: crewKeys.sharedParties() })
		}
	}
}

// ============================================================================
// Hooks (thin wrappers for component use)
// ============================================================================

export function useCreateParty() {
	const queryClient = useQueryClient()
	return createMutation(() => createPartyOptions(queryClient))
}

export function useUpdateParty() {
	const queryClient = useQueryClient()
	return createMutation(() => updatePartyOptions(queryClient))
}

export function useDeleteParty() {
	const queryClient = useQueryClient()
	return createMutation(() => deletePartyOptions(queryClient))
}

export function useRemixParty() {
	const queryClient = useQueryClient()
	return createMutation(() => remixPartyOptions(queryClient))
}

export function useFavoriteParty() {
	const queryClient = useQueryClient()
	return createMutation(() => favoritePartyOptions(queryClient))
}

export function useUnfavoriteParty() {
	const queryClient = useQueryClient()
	return createMutation(() => unfavoritePartyOptions(queryClient))
}

export function useRegeneratePreview() {
	const queryClient = useQueryClient()
	return createMutation(() => regeneratePreviewOptions(queryClient))
}

export function useSharePartyWithCrew() {
	const queryClient = useQueryClient()
	return createMutation(() => sharePartyWithCrewOptions(queryClient))
}

export function useRemovePartyShare() {
	const queryClient = useQueryClient()
	return createMutation(() => removePartyShareOptions(queryClient))
}
