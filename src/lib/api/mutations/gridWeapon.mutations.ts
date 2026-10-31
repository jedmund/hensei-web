/**
 * Grid weapon mutation configurations: create, update, delete, uncap,
 * conflict resolution, swap and duplicate, with optimistic updates.
 *
 * Each mutation exports both an options factory (for testing) and a hook (for components).
 *
 * @module api/mutations/gridWeapon
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import {
	gridAdapter,
	type CreateGridWeaponParams,
	type UpdateUncapParams,
	type ResolveConflictParams,
	type SwapPositionsParams
} from '$lib/api/adapters/grid.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party, GridWeapon } from '$lib/types/api/party'
import { editKeyHeaders, invalidateOnSettled, optimisticRollback } from './gridShared'

export function createGridWeaponOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			partyShortcode,
			...rest
		}: CreateGridWeaponParams & { partyShortcode: string }) =>
			gridAdapter.createWeapon(rest, editKeyHeaders(partyShortcode)),
		onMutate: async ({
			partyShortcode,
			position,
			mainhand
		}: CreateGridWeaponParams & { partyShortcode: string }) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(partyShortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(partyShortcode))

			if (previousParty?.weapons) {
				const updatedWeapons = previousParty.weapons.filter((w) =>
					mainhand ? !w.mainhand : w.position !== position
				)
				queryClient.setQueryData(partyKeys.detail(partyShortcode), {
					...previousParty,
					weapons: updatedWeapons
				})
			}

			return { previousParty }
		},
		onError: (
			_err: unknown,
			{ partyShortcode }: CreateGridWeaponParams & { partyShortcode: string },
			context: { previousParty?: Party } | undefined
		) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (
			_data: unknown,
			_err: unknown,
			{ partyShortcode }: CreateGridWeaponParams & { partyShortcode: string }
		) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function updateGridWeaponOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			id,
			partyShortcode,
			updates
		}: {
			id: string
			partyShortcode: string
			updates: Partial<GridWeapon>
		}) => gridAdapter.updateWeapon(id, updates, editKeyHeaders(partyShortcode)),
		onMutate: async ({
			id,
			partyShortcode,
			updates
		}: {
			id: string
			partyShortcode: string
			updates: Partial<GridWeapon>
		}) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(partyShortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(partyShortcode))

			if (previousParty?.weapons) {
				// Optimistic notes-sync fan-out: when the edit touches a synced
				// weapon's description or flips the flag, mirror those keys onto
				// every sibling (same canonical weapon in the party) so the UI
				// matches what the backend will produce.
				const target = previousParty.weapons.find((w) => w.id === id)
				const targetGranblueId = target?.weapon?.granblueId
				const groupKeysSet = new Set(['description', 'notesSynced', 'substitutions'])
				const groupPayload = Object.fromEntries(
					Object.entries(updates).filter(([k]) => groupKeysSet.has(k))
				) as Partial<GridWeapon>
				const flagInPayload = 'notesSynced' in updates
				const willBeSynced = flagInPayload
					? (updates as { notesSynced?: boolean }).notesSynced === true
					: !!target?.notesSynced
				const shouldFanOut =
					!!targetGranblueId &&
					willBeSynced &&
					(flagInPayload || Object.keys(groupPayload).length > 0)

				const updatedWeapons = previousParty.weapons.map((w) => {
					if (w.id === id) return { ...w, ...updates }
					if (shouldFanOut && String(w.weapon?.granblueId) === String(targetGranblueId)) {
						return { ...w, ...groupPayload }
					}
					return w
				})
				queryClient.setQueryData(partyKeys.detail(partyShortcode), {
					...previousParty,
					weapons: updatedWeapons
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

export function deleteGridWeaponOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: {
			id?: string
			partyId: string
			partyShortcode: string
			position?: number
		}) =>
			gridAdapter.deleteWeapon(
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

			if (previousParty?.weapons) {
				const updatedWeapons = previousParty.weapons.filter((w) =>
					id ? w.id !== id : w.position !== position
				)
				queryClient.setQueryData(partyKeys.detail(partyShortcode), {
					...previousParty,
					weapons: updatedWeapons
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

export function updateWeaponUncapOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: UpdateUncapParams & { partyShortcode: string }) =>
			gridAdapter.updateWeaponUncap(params, editKeyHeaders(params.partyShortcode)),
		onMutate: async ({
			partyShortcode,
			id,
			uncapLevel,
			transcendenceStep
		}: UpdateUncapParams & { partyShortcode: string }) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(partyShortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(partyShortcode))

			if (previousParty?.weapons) {
				const updatedWeapons = previousParty.weapons.map((w) =>
					w.id === id
						? {
								...w,
								uncapLevel,
								...(transcendenceStep !== undefined && { transcendenceStep })
							}
						: w
				)
				queryClient.setQueryData(partyKeys.detail(partyShortcode), {
					...previousParty,
					weapons: updatedWeapons
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

export function resolveWeaponConflictOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: ResolveConflictParams & { partyShortcode: string }) =>
			gridAdapter.resolveWeaponConflict(params, editKeyHeaders(params.partyShortcode)),
		onSuccess: (_data: unknown, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function swapWeaponsOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: SwapPositionsParams & { partyShortcode: string }) =>
			gridAdapter.swapWeapons(params, editKeyHeaders(params.partyShortcode)),
		onSuccess: (_data: unknown, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function duplicateGridWeaponOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id: string; partyShortcode: string; position: number }) =>
			gridAdapter.duplicateWeapon(
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

export function useCreateGridWeapon() {
	const queryClient = useQueryClient()
	return createMutation(() => createGridWeaponOptions(queryClient))
}

export function useUpdateGridWeapon() {
	const queryClient = useQueryClient()
	return createMutation(() => updateGridWeaponOptions(queryClient))
}

export function useDeleteGridWeapon() {
	const queryClient = useQueryClient()
	return createMutation(() => deleteGridWeaponOptions(queryClient))
}

export function useUpdateWeaponUncap() {
	const queryClient = useQueryClient()
	return createMutation(() => updateWeaponUncapOptions(queryClient))
}

export function useResolveWeaponConflict() {
	const queryClient = useQueryClient()
	return createMutation(() => resolveWeaponConflictOptions(queryClient))
}

export function useSwapWeapons() {
	const queryClient = useQueryClient()
	return createMutation(() => swapWeaponsOptions(queryClient))
}

export function useDuplicateGridWeapon() {
	const queryClient = useQueryClient()
	return createMutation(() => duplicateGridWeaponOptions(queryClient))
}
