/**
 * Grid Mutation Configurations
 *
 * Provides mutation configurations for grid item operations (weapons, characters, summons)
 * with cache invalidation and optimistic updates using TanStack Query v6.
 *
 * Each mutation exports both an options factory (for testing) and a hook (for components).
 *
 * @module api/mutations/grid
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import {
	gridAdapter,
	type CreateGridWeaponParams,
	type CreateGridCharacterParams,
	type CreateGridSummonParams,
	type UpdateUncapParams,
	type ResolveConflictParams,
	type SwapPositionsParams
} from '$lib/api/adapters/grid.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party, GridWeapon, GridCharacter, GridSummon } from '$lib/types/api/party'
import { getEditKey } from '$lib/utils/editKeys'
import { invalidateParty } from '$lib/query/cacheHelpers'

// ============================================================================
// Mutation Factory
// ============================================================================

/**
 * Wraps a grid adapter method to automatically inject edit key headers for anonymous users.
 * When a party has an edit key stored in localStorage, it's automatically sent in the X-Edit-Key header.
 *
 * For anonymous users:
 * - Edit key is retrieved from localStorage using party shortcode
 * - X-Edit-Key header is automatically injected
 *
 * For authenticated users:
 * - No edit key in localStorage
 * - Falls back to Bearer token (existing behavior)
 *
 * @param adapterMethod - The grid adapter method to wrap
 * @returns Wrapped method that automatically handles edit key injection
 */
export function createGridMutation<TParams extends { partyId: number | string }>(
	adapterMethod: (params: TParams, headers?: Record<string, string>) => Promise<any>
) {
	return (params: TParams) => {
		const editKey = typeof params.partyId === 'string' ? getEditKey(params.partyId) : null
		const headers = editKey ? { 'X-Edit-Key': editKey } : undefined
		return adapterMethod(params, headers)
	}
}

// ============================================================================
// Shared optimistic update helpers
// ============================================================================

function optimisticRollback(
	queryClient: QueryClient,
	partyShortcode: string,
	context: { previousParty?: Party } | undefined
) {
	if (context?.previousParty) {
		queryClient.setQueryData(partyKeys.detail(partyShortcode), context.previousParty)
	}
}

function invalidateOnSettled(queryClient: QueryClient, partyShortcode: string) {
	queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
}

// ============================================================================
// Weapon Mutation Options
// ============================================================================

export function createGridWeaponOptions(queryClient: QueryClient) {
	return {
		mutationFn: createGridMutation((params: CreateGridWeaponParams, headers?: Record<string, string>) =>
			gridAdapter.createWeapon(params, headers)
		),
		onSuccess: (_data: any, params: CreateGridWeaponParams) => {
			invalidateParty(queryClient, params.partyId)
		}
	}
}

export function updateGridWeaponOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, updates }: { id: string; partyShortcode: string; updates: Partial<GridWeapon> }) =>
			gridAdapter.updateWeapon(id, updates),
		onMutate: async ({ id, partyShortcode, updates }: { id: string; partyShortcode: string; updates: Partial<GridWeapon> }) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(partyShortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(partyShortcode))

			if (previousParty?.weapons) {
				const updatedWeapons = previousParty.weapons.map((w) =>
					w.id === id ? { ...w, ...updates } : w
				)
				queryClient.setQueryData(partyKeys.detail(partyShortcode), {
					...previousParty,
					weapons: updatedWeapons
				})
			}

			return { previousParty }
		},
		onError: (_err: any, { partyShortcode }: { partyShortcode: string }, context: { previousParty?: Party } | undefined) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (_data: any, _err: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function deleteGridWeaponOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id?: string; partyId: string; partyShortcode: string; position?: number }) =>
			gridAdapter.deleteWeapon({ id: params.id, partyId: params.partyId, position: params.position }),
		onMutate: async ({ partyShortcode, id, position }: { partyShortcode: string; id?: string; position?: number }) => {
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
		onError: (_err: any, { partyShortcode }: { partyShortcode: string }, context: { previousParty?: Party } | undefined) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (_data: any, _err: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function updateWeaponUncapOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: UpdateUncapParams & { partyShortcode: string }) =>
			gridAdapter.updateWeaponUncap(params),
		onMutate: async ({ partyShortcode, id, uncapLevel, transcendenceStep }: UpdateUncapParams & { partyShortcode: string }) => {
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
		onError: (_err: any, { partyShortcode }: { partyShortcode: string }, context: { previousParty?: Party } | undefined) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (_data: any, _err: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function resolveWeaponConflictOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: ResolveConflictParams & { partyShortcode: string }) =>
			gridAdapter.resolveWeaponConflict(params),
		onSuccess: (_data: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function swapWeaponsOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: SwapPositionsParams & { partyShortcode: string }) =>
			gridAdapter.swapWeapons(params),
		onSuccess: (_data: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function duplicateGridWeaponOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id: string; partyShortcode: string; position: number }) =>
			gridAdapter.duplicateWeapon({ id: params.id, position: params.position }),
		onSuccess: (_data: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

// ============================================================================
// Character Mutation Options
// ============================================================================

export function createGridCharacterOptions(queryClient: QueryClient) {
	return {
		mutationFn: createGridMutation((params: CreateGridCharacterParams, headers?: Record<string, string>) =>
			gridAdapter.createCharacter(params, headers)
		),
		onSuccess: (_data: any, params: CreateGridCharacterParams) => {
			invalidateParty(queryClient, params.partyId)
		}
	}
}

export function updateGridCharacterOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, updates }: { id: string; partyShortcode: string; updates: Partial<GridCharacter> }) =>
			gridAdapter.updateCharacter(id, updates),
		onMutate: async ({ id, partyShortcode, updates }: { id: string; partyShortcode: string; updates: Partial<GridCharacter> }) => {
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
		onError: (_err: any, { partyShortcode }: { partyShortcode: string }, context: { previousParty?: Party } | undefined) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (_data: any, _err: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function deleteGridCharacterOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id?: string; partyId: string; partyShortcode: string; position?: number }) =>
			gridAdapter.deleteCharacter({ id: params.id, partyId: params.partyId, position: params.position }),
		onMutate: async ({ partyShortcode, id, position }: { partyShortcode: string; id?: string; position?: number }) => {
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
		onError: (_err: any, { partyShortcode }: { partyShortcode: string }, context: { previousParty?: Party } | undefined) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (_data: any, _err: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function updateCharacterUncapOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: UpdateUncapParams & { partyShortcode: string }) =>
			gridAdapter.updateCharacterUncap(params),
		onMutate: async ({ partyShortcode, id, uncapLevel, transcendenceStep }: UpdateUncapParams & { partyShortcode: string }) => {
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
		onError: (_err: any, { partyShortcode }: { partyShortcode: string }, context: { previousParty?: Party } | undefined) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (_data: any, _err: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function resolveCharacterConflictOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: ResolveConflictParams & { partyShortcode: string }) =>
			gridAdapter.resolveCharacterConflict(params),
		onSuccess: (_data: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function swapCharactersOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: SwapPositionsParams & { partyShortcode: string }) =>
			gridAdapter.swapCharacters(params),
		onSuccess: (_data: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

// ============================================================================
// Summon Mutation Options
// ============================================================================

export function createGridSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: createGridMutation((params: CreateGridSummonParams, headers?: Record<string, string>) =>
			gridAdapter.createSummon(params, headers)
		),
		onSuccess: (_data: any, params: CreateGridSummonParams) => {
			invalidateParty(queryClient, params.partyId)
		}
	}
}

export function updateGridSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, updates }: { id: string; partyShortcode: string; updates: Partial<GridSummon> }) =>
			gridAdapter.updateSummon(id, updates),
		onMutate: async ({ id, partyShortcode, updates }: { id: string; partyShortcode: string; updates: Partial<GridSummon> }) => {
			await queryClient.cancelQueries({ queryKey: partyKeys.detail(partyShortcode) })

			const previousParty = queryClient.getQueryData<Party>(partyKeys.detail(partyShortcode))

			if (previousParty?.summons) {
				const updatedSummons = previousParty.summons.map((s) =>
					s.id === id ? { ...s, ...updates } : s
				)
				queryClient.setQueryData(partyKeys.detail(partyShortcode), {
					...previousParty,
					summons: updatedSummons
				})
			}

			return { previousParty }
		},
		onError: (_err: any, { partyShortcode }: { partyShortcode: string }, context: { previousParty?: Party } | undefined) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (_data: any, _err: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function deleteGridSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id?: string; partyId: string; partyShortcode: string; position?: number }) =>
			gridAdapter.deleteSummon({ id: params.id, partyId: params.partyId, position: params.position }),
		onMutate: async ({ partyShortcode, id, position }: { partyShortcode: string; id?: string; position?: number }) => {
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
		onError: (_err: any, { partyShortcode }: { partyShortcode: string }, context: { previousParty?: Party } | undefined) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (_data: any, _err: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function updateSummonUncapOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: UpdateUncapParams & { partyShortcode: string }) =>
			gridAdapter.updateSummonUncap(params),
		onMutate: async ({ partyShortcode, id, uncapLevel, transcendenceStep }: UpdateUncapParams & { partyShortcode: string }) => {
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
		onError: (_err: any, { partyShortcode }: { partyShortcode: string }, context: { previousParty?: Party } | undefined) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (_data: any, _err: any, { partyShortcode }: { partyShortcode: string }) => {
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
			gridAdapter.updateQuickSummon({
				id: params.id,
				partyId: params.partyId,
				position: params.position,
				quickSummon: params.quickSummon
			}),
		onMutate: async ({ partyShortcode, id, quickSummon }: { partyShortcode: string; id?: string; quickSummon: boolean }) => {
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
		onError: (_err: any, { partyShortcode }: { partyShortcode: string }, context: { previousParty?: Party } | undefined) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (_data: any, _err: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function swapSummonsOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: SwapPositionsParams & { partyShortcode: string }) =>
			gridAdapter.swapSummons(params),
		onSuccess: (_data: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function duplicateGridSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id: string; partyShortcode: string; position: number }) =>
			gridAdapter.duplicateSummon({ id: params.id, position: params.position }),
		onSuccess: (_data: any, { partyShortcode }: { partyShortcode: string }) => {
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
			gridAdapter.switchCharacterStyle(params.id),
		onSuccess: (_data: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

// ============================================================================
// Sync Mutation Options
// ============================================================================

export function syncGridCharacterOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id: string; partyShortcode: string }) =>
			gridAdapter.syncCharacter(params.id),
		onSuccess: (_data: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function syncGridWeaponOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id: string; partyShortcode: string }) =>
			gridAdapter.syncWeapon(params.id),
		onSuccess: (_data: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function syncGridSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id: string; partyShortcode: string }) =>
			gridAdapter.syncSummon(params.id),
		onSuccess: (_data: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function syncAllPartyItemsOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { partyId: string; partyShortcode: string }) =>
			gridAdapter.syncAllPartyItems(params.partyId),
		onSuccess: (_data: any, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function unlinkCollectionSourceOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { partyId: string; partyShortcode: string }) =>
			gridAdapter.unlinkCollectionSource(params.partyId),
		onSuccess: (_data: any, { partyShortcode }: { partyShortcode: string }) => {
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

export function useSwitchCharacterStyle() {
	const queryClient = useQueryClient()
	return createMutation(() => switchCharacterStyleOptions(queryClient))
}

export function useSyncGridCharacter() {
	const queryClient = useQueryClient()
	return createMutation(() => syncGridCharacterOptions(queryClient))
}

export function useSyncGridWeapon() {
	const queryClient = useQueryClient()
	return createMutation(() => syncGridWeaponOptions(queryClient))
}

export function useSyncGridSummon() {
	const queryClient = useQueryClient()
	return createMutation(() => syncGridSummonOptions(queryClient))
}

export function useSyncAllPartyItems() {
	const queryClient = useQueryClient()
	return createMutation(() => syncAllPartyItemsOptions(queryClient))
}

export function useUnlinkCollectionSource() {
	const queryClient = useQueryClient()
	return createMutation(() => unlinkCollectionSourceOptions(queryClient))
}
