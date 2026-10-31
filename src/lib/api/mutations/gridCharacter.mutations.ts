/**
 * Grid character mutation configurations: create, update, delete, uncap,
 * conflict resolution, swap and style switch, with optimistic updates.
 *
 * Each mutation exports both an options factory (for testing) and a hook (for components).
 *
 * @module api/mutations/gridCharacter
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import {
	gridAdapter,
	type CreateGridCharacterParams,
	type UpdateUncapParams,
	type ResolveConflictParams,
	type SwapPositionsParams
} from '$lib/api/adapters/grid.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party, GridCharacter } from '$lib/types/api/party'
import { editKeyHeaders, invalidateOnSettled, optimisticRollback } from './gridShared'

export function createGridCharacterOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			partyShortcode,
			...rest
		}: CreateGridCharacterParams & { partyShortcode: string }) =>
			gridAdapter.createCharacter(rest, editKeyHeaders(partyShortcode)),
		onMutate: async ({
			partyShortcode,
			position
		}: CreateGridCharacterParams & { partyShortcode: string }) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(partyShortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(partyShortcode))

			if (previousParty?.characters) {
				const updatedCharacters = previousParty.characters.filter((c) => c.position !== position)
				queryClient.setQueryData(partyKeys.detail(partyShortcode), {
					...previousParty,
					characters: updatedCharacters
				})
			}

			return { previousParty }
		},
		onError: (
			_err: unknown,
			{ partyShortcode }: CreateGridCharacterParams & { partyShortcode: string },
			context: { previousParty?: Party } | undefined
		) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (
			_data: unknown,
			_err: unknown,
			{ partyShortcode }: CreateGridCharacterParams & { partyShortcode: string }
		) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function updateGridCharacterOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			id,
			partyShortcode,
			updates
		}: {
			id: string
			partyShortcode: string
			updates: Partial<GridCharacter>
		}) => gridAdapter.updateCharacter(id, updates, editKeyHeaders(partyShortcode)),
		onMutate: async ({
			id,
			partyShortcode,
			updates
		}: {
			id: string
			partyShortcode: string
			updates: Partial<GridCharacter>
		}) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(partyShortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(partyShortcode))

			if (previousParty?.characters) {
				const updatedCharacters = previousParty.characters.map((c) =>
					c.id === id ? { ...c, ...updates } : c
				)
				queryClient.setQueryData(partyKeys.detail(partyShortcode), {
					...previousParty,
					characters: updatedCharacters
				})
			}

			return { previousParty }
		},
		onError: (
			_err: unknown,
			{ partyShortcode }: { partyShortcode: string },
			context: { previousParty?: Party } | undefined
		) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (_data: unknown, _err: unknown, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function deleteGridCharacterOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: {
			id?: string
			partyId: string
			partyShortcode: string
			position?: number
		}) =>
			gridAdapter.deleteCharacter(
				{ id: params.id, partyId: params.partyId, position: params.position },
				editKeyHeaders(params.partyShortcode)
			),
		onMutate: async ({
			partyShortcode,
			id,
			position
		}: {
			partyShortcode: string
			id?: string
			position?: number
		}) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(partyShortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(partyShortcode))

			if (previousParty?.characters) {
				const updatedCharacters = previousParty.characters.filter((c) =>
					id ? c.id !== id : c.position !== position
				)
				queryClient.setQueryData(partyKeys.detail(partyShortcode), {
					...previousParty,
					characters: updatedCharacters
				})
			}

			return { previousParty }
		},
		onError: (
			_err: unknown,
			{ partyShortcode }: { partyShortcode: string },
			context: { previousParty?: Party } | undefined
		) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (_data: unknown, _err: unknown, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function updateCharacterUncapOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: UpdateUncapParams & { partyShortcode: string }) =>
			gridAdapter.updateCharacterUncap(params, editKeyHeaders(params.partyShortcode)),
		onMutate: async ({
			partyShortcode,
			id,
			uncapLevel,
			transcendenceStep
		}: UpdateUncapParams & { partyShortcode: string }) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(partyShortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(partyShortcode))

			if (previousParty?.characters) {
				const updatedCharacters = previousParty.characters.map((c) =>
					c.id === id
						? {
								...c,
								uncapLevel,
								...(transcendenceStep !== undefined && { transcendenceStep })
							}
						: c
				)
				queryClient.setQueryData(partyKeys.detail(partyShortcode), {
					...previousParty,
					characters: updatedCharacters
				})
			}

			return { previousParty }
		},
		onError: (
			_err: unknown,
			{ partyShortcode }: { partyShortcode: string },
			context: { previousParty?: Party } | undefined
		) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (_data: unknown, _err: unknown, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function resolveCharacterConflictOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: ResolveConflictParams & { partyShortcode: string }) =>
			gridAdapter.resolveCharacterConflict(params, editKeyHeaders(params.partyShortcode)),
		onSuccess: (_data: unknown, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function swapCharactersOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: SwapPositionsParams & { partyShortcode: string }) =>
			gridAdapter.swapCharacters(params, editKeyHeaders(params.partyShortcode)),
		onSuccess: (_data: unknown, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

// ============================================================================
// Style Swap Mutation Options
// ============================================================================

export function switchCharacterStyleOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id: string; partyShortcode: string }) =>
			gridAdapter.switchCharacterStyle(params.id, editKeyHeaders(params.partyShortcode)),
		onSuccess: (_data: unknown, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

// ============================================================================
// Svelte Hooks (thin wrappers for component use)
// ============================================================================

export function useCreateGridCharacter() {
	const queryClient = useQueryClient()
	return createMutation(() => createGridCharacterOptions(queryClient))
}

export function useUpdateGridCharacter() {
	const queryClient = useQueryClient()
	return createMutation(() => updateGridCharacterOptions(queryClient))
}

export function useDeleteGridCharacter() {
	const queryClient = useQueryClient()
	return createMutation(() => deleteGridCharacterOptions(queryClient))
}

export function useUpdateCharacterUncap() {
	const queryClient = useQueryClient()
	return createMutation(() => updateCharacterUncapOptions(queryClient))
}

export function useResolveCharacterConflict() {
	const queryClient = useQueryClient()
	return createMutation(() => resolveCharacterConflictOptions(queryClient))
}

export function useSwapCharacters() {
	const queryClient = useQueryClient()
	return createMutation(() => swapCharactersOptions(queryClient))
}

export function useSwitchCharacterStyle() {
	const queryClient = useQueryClient()
	return createMutation(() => switchCharacterStyleOptions(queryClient))
}
