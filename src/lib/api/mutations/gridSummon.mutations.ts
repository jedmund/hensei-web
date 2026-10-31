/**
 * Grid summon mutation configurations: create, update, delete, uncap,
 * quick summon, swap and duplicate, with optimistic updates.
 *
 * Each mutation exports both an options factory (for testing) and a hook (for components).
 *
 * @module api/mutations/gridSummon
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import {
	gridAdapter,
	type CreateGridSummonParams,
	type UpdateUncapParams,
	type SwapPositionsParams
} from '$lib/api/adapters/grid.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party, GridSummon } from '$lib/types/api/party'
import { editKeyHeaders, invalidateOnSettled, optimisticRollback } from './gridShared'

export function createGridSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			partyShortcode,
			...rest
		}: CreateGridSummonParams & { partyShortcode: string }) =>
			gridAdapter.createSummon(rest, editKeyHeaders(partyShortcode)),
		onMutate: async ({
			partyShortcode,
			position,
			main,
			friend
		}: CreateGridSummonParams & { partyShortcode: string }) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(partyShortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(partyShortcode))

			if (previousParty?.summons) {
				const updatedSummons = previousParty.summons.filter((s) =>
					main ? !s.main : friend ? !s.friend : s.position !== position
				)
				queryClient.setQueryData(partyKeys.detail(partyShortcode), {
					...previousParty,
					summons: updatedSummons
				})
			}

			return { previousParty }
		},
		onError: (
			_err: unknown,
			{ partyShortcode }: CreateGridSummonParams & { partyShortcode: string },
			context: { previousParty?: Party } | undefined
		) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (
			_data: unknown,
			_err: unknown,
			{ partyShortcode }: CreateGridSummonParams & { partyShortcode: string }
		) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function updateGridSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			id,
			partyShortcode,
			updates
		}: {
			id: string
			partyShortcode: string
			updates: Partial<GridSummon>
		}) => gridAdapter.updateSummon(id, updates, editKeyHeaders(partyShortcode)),
		onMutate: async ({
			id,
			partyShortcode,
			updates
		}: {
			id: string
			partyShortcode: string
			updates: Partial<GridSummon>
		}) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(partyShortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(partyShortcode))

			if (previousParty?.summons) {
				// Optimistic notes-sync fan-out — see updateGridWeaponOptions for
				// the rationale. Mirrors description/notesSynced/substitutions
				// onto every sibling sharing this summon's granblue_id.
				const target = previousParty.summons.find((s) => s.id === id)
				const targetGranblueId = target?.summon?.granblueId
				const groupKeysSet = new Set(['description', 'notesSynced', 'substitutions'])
				const groupPayload = Object.fromEntries(
					Object.entries(updates).filter(([k]) => groupKeysSet.has(k))
				) as Partial<GridSummon>
				const flagInPayload = 'notesSynced' in updates
				const willBeSynced = flagInPayload
					? (updates as { notesSynced?: boolean }).notesSynced === true
					: !!target?.notesSynced
				const shouldFanOut =
					!!targetGranblueId &&
					willBeSynced &&
					(flagInPayload || Object.keys(groupPayload).length > 0)

				const updatedSummons = previousParty.summons.map((s) => {
					if (s.id === id) return { ...s, ...updates }
					if (shouldFanOut && String(s.summon?.granblueId) === String(targetGranblueId)) {
						return { ...s, ...groupPayload }
					}
					return s
				})
				queryClient.setQueryData(partyKeys.detail(partyShortcode), {
					...previousParty,
					summons: updatedSummons
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

export function deleteGridSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: {
			id?: string
			partyId: string
			partyShortcode: string
			position?: number
		}) =>
			gridAdapter.deleteSummon(
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

			if (previousParty?.summons) {
				const updatedSummons = previousParty.summons.filter((s) =>
					id ? s.id !== id : s.position !== position
				)
				queryClient.setQueryData(partyKeys.detail(partyShortcode), {
					...previousParty,
					summons: updatedSummons
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

export function updateSummonUncapOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: UpdateUncapParams & { partyShortcode: string }) =>
			gridAdapter.updateSummonUncap(params, editKeyHeaders(params.partyShortcode)),
		onMutate: async ({
			partyShortcode,
			id,
			uncapLevel,
			transcendenceStep
		}: UpdateUncapParams & { partyShortcode: string }) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(partyShortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(partyShortcode))

			if (previousParty?.summons) {
				const updatedSummons = previousParty.summons.map((s) =>
					s.id === id
						? {
								...s,
								uncapLevel,
								...(transcendenceStep !== undefined && { transcendenceStep })
							}
						: s
				)
				queryClient.setQueryData(partyKeys.detail(partyShortcode), {
					...previousParty,
					summons: updatedSummons
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

export function updateQuickSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: {
			id?: string
			partyId: string
			partyShortcode: string
			position?: number
			quickSummon: boolean
		}) =>
			gridAdapter.updateQuickSummon(
				{
					id: params.id,
					partyId: params.partyId,
					position: params.position,
					quickSummon: params.quickSummon
				},
				editKeyHeaders(params.partyShortcode)
			),
		onMutate: async ({
			partyShortcode,
			id,
			quickSummon
		}: {
			partyShortcode: string
			id?: string
			quickSummon: boolean
		}) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(partyShortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(partyShortcode))

			if (previousParty?.summons) {
				const updatedSummons = previousParty.summons.map((s) =>
					s.id === id ? { ...s, quickSummon } : s
				)
				queryClient.setQueryData(partyKeys.detail(partyShortcode), {
					...previousParty,
					summons: updatedSummons
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

export function swapSummonsOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: SwapPositionsParams & { partyShortcode: string }) =>
			gridAdapter.swapSummons(params, editKeyHeaders(params.partyShortcode)),
		onSuccess: (_data: unknown, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function duplicateGridSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id: string; partyShortcode: string; position: number }) =>
			gridAdapter.duplicateSummon(
				{ id: params.id, position: params.position },
				editKeyHeaders(params.partyShortcode)
			),
		onSuccess: (_data: unknown, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

// ============================================================================
// Svelte Hooks (thin wrappers for component use)
// ============================================================================

export function useCreateGridSummon() {
	const queryClient = useQueryClient()
	return createMutation(() => createGridSummonOptions(queryClient))
}

export function useUpdateGridSummon() {
	const queryClient = useQueryClient()
	return createMutation(() => updateGridSummonOptions(queryClient))
}

export function useDeleteGridSummon() {
	const queryClient = useQueryClient()
	return createMutation(() => deleteGridSummonOptions(queryClient))
}

export function useUpdateSummonUncap() {
	const queryClient = useQueryClient()
	return createMutation(() => updateSummonUncapOptions(queryClient))
}

export function useUpdateQuickSummon() {
	const queryClient = useQueryClient()
	return createMutation(() => updateQuickSummonOptions(queryClient))
}

export function useSwapSummons() {
	const queryClient = useQueryClient()
	return createMutation(() => swapSummonsOptions(queryClient))
}

export function useDuplicateGridSummon() {
	const queryClient = useQueryClient()
	return createMutation(() => duplicateGridSummonOptions(queryClient))
}
