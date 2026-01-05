/**
 * Party Mutation Configurations
 *
 * Provides mutation configurations for party CRUD operations
 * with cache invalidation and optimistic updates using TanStack Query v6.
 *
 * @module api/mutations/party
 */

import { useQueryClient, createMutation } from '@tanstack/svelte-query'
import {
	partyAdapter,
	type CreatePartyParams,
	type UpdatePartyParams
} from '$lib/api/adapters/party.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import { userKeys } from '$lib/api/queries/user.queries'
import { crewKeys } from '$lib/api/queries/crew.queries'
import type { Party } from '$lib/types/api/party'

/**
 * Create party mutation
 *
 * Creates a new party and invalidates relevant caches.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useCreateParty } from '$lib/api/mutations/party.mutations'
 *
 *   const createParty = useCreateParty()
 *
 *   function handleCreate() {
 *     createParty.mutate({ name: 'My Party', visibility: 'public' })
 *   }
 * </script>
 * ```
 */
export function useCreateParty() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: CreatePartyParams) => partyAdapter.create(params),
		onSuccess: (party) => {
			// Set the new party in cache
			queryClient.setQueryData(partyKeys.detail(party.shortcode), party)
			// Invalidate party lists to include the new party
			queryClient.invalidateQueries({ queryKey: partyKeys.lists() })
			// Invalidate user's party lists
			queryClient.invalidateQueries({ queryKey: userKeys.all })
		}
	}))
}

/**
 * Update party mutation
 *
 * Updates an existing party with optimistic updates.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useUpdateParty } from '$lib/api/mutations/party.mutations'
 *
 *   const updateParty = useUpdateParty()
 *
 *   function handleUpdate() {
 *     updateParty.mutate({ shortcode: 'abc123', name: 'Updated Name' })
 *   }
 * </script>
 * ```
 */
export function useUpdateParty() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: UpdatePartyParams) => partyAdapter.update(params),
		onMutate: async (params) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(params.shortcode) })

			// Snapshot the previous value
			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(params.shortcode))

			// Optimistically update the cache
			if (previousParty) {
				queryClient.setQueryData(partyKeys.detail(params.shortcode), {
					...previousParty,
					...params
				})
			}

			return { previousParty }
		},
		onError: (_err, params, context) => {
			// Rollback on error
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(params.shortcode), context.previousParty)
			}
		},
		onSettled: (_data, _err, params) => {
			// Always refetch after error or success
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(params.shortcode) })
		}
	}))
}

/**
 * Delete party mutation
 *
 * Deletes a party and removes it from all caches.
 * Note: The API expects the party UUID (id), not the shortcode.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useDeleteParty } from '$lib/api/mutations/party.mutations'
 *
 *   const deleteParty = useDeleteParty()
 *
 *   function handleDelete(id: string, shortcode: string) {
 *     deleteParty.mutate({ id, shortcode })
 *   }
 * </script>
 * ```
 */
export function useDeleteParty() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: { id: string; shortcode: string }) => partyAdapter.delete(params.id),
		onSuccess: (_data, params) => {
			// Remove the party from cache (keyed by shortcode)
			queryClient.removeQueries({ queryKey: partyKeys.detail(params.shortcode) })
			// Invalidate party lists
			queryClient.invalidateQueries({ queryKey: partyKeys.lists() })
			// Invalidate user's party lists
			queryClient.invalidateQueries({ queryKey: userKeys.all })
		}
	}))
}

/**
 * Remix party mutation
 *
 * Creates a copy of an existing party.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useRemixParty } from '$lib/api/mutations/party.mutations'
 *
 *   const remixParty = useRemixParty()
 *
 *   function handleRemix(shortcode: string) {
 *     remixParty.mutate(shortcode)
 *   }
 * </script>
 * ```
 */
export function useRemixParty() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (shortcode: string) => partyAdapter.remix(shortcode),
		onSuccess: (newParty) => {
			// Set the new party in cache
			queryClient.setQueryData(partyKeys.detail(newParty.shortcode), newParty)
			// Invalidate party lists to include the new party
			queryClient.invalidateQueries({ queryKey: partyKeys.lists() })
			// Invalidate user's party lists
			queryClient.invalidateQueries({ queryKey: userKeys.all })
		}
	}))
}

/**
 * Favorite party mutation
 *
 * Adds a party to the user's favorites.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useFavoriteParty } from '$lib/api/mutations/party.mutations'
 *
 *   const favoriteParty = useFavoriteParty()
 *
 *   function handleFavorite(shortcode: string) {
 *     favoriteParty.mutate(shortcode)
 *   }
 * </script>
 * ```
 */
export function useFavoriteParty() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (shortcode: string) => partyAdapter.favorite(shortcode),
		onMutate: async (shortcode) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(shortcode) })

			// Snapshot the previous value
			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(shortcode))

			// Optimistically update the cache
			if (previousParty) {
				queryClient.setQueryData(partyKeys.detail(shortcode), {
					...previousParty,
					favorited: true
				})
			}

			return { previousParty }
		},
		onError: (_err, shortcode, context) => {
			// Rollback on error
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(shortcode), context.previousParty)
			}
		},
		onSettled: (_data, _err, shortcode) => {
			// Invalidate favorites list
			queryClient.invalidateQueries({ queryKey: userKeys.favorites() })
			// Refetch the party to get accurate state
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
		}
	}))
}

/**
 * Unfavorite party mutation
 *
 * Removes a party from the user's favorites.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useUnfavoriteParty } from '$lib/api/mutations/party.mutations'
 *
 *   const unfavoriteParty = useUnfavoriteParty()
 *
 *   function handleUnfavorite(shortcode: string) {
 *     unfavoriteParty.mutate(shortcode)
 *   }
 * </script>
 * ```
 */
export function useUnfavoriteParty() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (shortcode: string) => partyAdapter.unfavorite(shortcode),
		onMutate: async (shortcode) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(shortcode) })

			// Snapshot the previous value
			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(shortcode))

			// Optimistically update the cache
			if (previousParty) {
				queryClient.setQueryData(partyKeys.detail(shortcode), {
					...previousParty,
					favorited: false
				})
			}

			return { previousParty }
		},
		onError: (_err, shortcode, context) => {
			// Rollback on error
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(shortcode), context.previousParty)
			}
		},
		onSettled: (_data, _err, shortcode) => {
			// Invalidate favorites list
			queryClient.invalidateQueries({ queryKey: userKeys.favorites() })
			// Refetch the party to get accurate state
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
		}
	}))
}

/**
 * Regenerate preview mutation
 *
 * Triggers regeneration of a party's preview image.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useRegeneratePreview } from '$lib/api/mutations/party.mutations'
 *
 *   const regeneratePreview = useRegeneratePreview()
 *
 *   function handleRegenerate(shortcode: string) {
 *     regeneratePreview.mutate(shortcode)
 *   }
 * </script>
 * ```
 */
export function useRegeneratePreview() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (shortcode: string) => partyAdapter.regeneratePreview(shortcode),
		onSuccess: (_data, shortcode) => {
			// Invalidate preview status to trigger refetch
			queryClient.invalidateQueries({ queryKey: partyKeys.preview(shortcode) })
		}
	}))
}

/**
 * Share party with crew mutation
 *
 * Shares a party with the current user's crew.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useSharePartyWithCrew } from '$lib/api/mutations/party.mutations'
 *
 *   const shareParty = useSharePartyWithCrew()
 *
 *   function handleShare(partyId: string, shortcode: string) {
 *     shareParty.mutate({ partyId, shortcode })
 *   }
 * </script>
 * ```
 */
export function useSharePartyWithCrew() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({ partyId }: { partyId: string; shortcode: string }) =>
			partyAdapter.shareWithCrew(partyId),
		onSuccess: (_share, { shortcode }) => {
			// Invalidate the party to refresh its shares
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
			// Invalidate crew's shared parties list
			queryClient.invalidateQueries({ queryKey: crewKeys.sharedParties() })
		}
	}))
}

/**
 * Remove party share mutation
 *
 * Removes a share from a party.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useRemovePartyShare } from '$lib/api/mutations/party.mutations'
 *
 *   const removeShare = useRemovePartyShare()
 *
 *   function handleRemoveShare(partyId: string, shareId: string, shortcode: string) {
 *     removeShare.mutate({ partyId, shareId, shortcode })
 *   }
 * </script>
 * ```
 */
export function useRemovePartyShare() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({ partyId, shareId }: { partyId: string; shareId: string; shortcode: string }) =>
			partyAdapter.removeShare(partyId, shareId),
		onSuccess: (_data, { shortcode }) => {
			// Invalidate the party to refresh its shares
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
			// Invalidate crew's shared parties list
			queryClient.invalidateQueries({ queryKey: crewKeys.sharedParties() })
		}
	}))
}
