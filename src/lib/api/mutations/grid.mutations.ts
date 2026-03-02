/**
 * Grid Mutation Configurations
 *
 * Provides mutation configurations for grid item operations (weapons, characters, summons)
 * with cache invalidation and optimistic updates using TanStack Query v6.
 *
 * @module api/mutations/grid
 */

import { useQueryClient, createMutation } from '@tanstack/svelte-query'
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
function createGridMutation<TParams extends { partyId: number | string }>(
	adapterMethod: (params: TParams, headers?: Record<string, string>) => Promise<any>
) {
	return (params: TParams) => {
		const editKey = typeof params.partyId === 'string' ? getEditKey(params.partyId) : null
		const headers = editKey ? { 'X-Edit-Key': editKey } : undefined
		return adapterMethod(params, headers)
	}
}

// ============================================================================
// Weapon Mutations
// ============================================================================

/**
 * Create grid weapon mutation
 *
 * Adds a weapon to a party's grid.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useCreateGridWeapon } from '$lib/api/mutations/grid.mutations'
 *
 *   const createWeapon = useCreateGridWeapon()
 *
 *   function handleAddWeapon() {
 *     createWeapon.mutate({
 *       partyId: 'party-uuid',
 *       weaponId: 'weapon-id',
 *       position: 1
 *     })
 *   }
 * </script>
 * ```
 */
export function useCreateGridWeapon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: createGridMutation((params: CreateGridWeaponParams, headers?: Record<string, string>) =>
			gridAdapter.createWeapon(params, headers)
		),
		onSuccess: (_data, params) => {
			invalidateParty(queryClient, params.partyId)
		}
	}))
}

/**
 * Update grid weapon mutation
 *
 * Updates a weapon in a party's grid with optimistic updates.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useUpdateGridWeapon } from '$lib/api/mutations/grid.mutations'
 *
 *   const updateWeapon = useUpdateGridWeapon()
 *
 *   function handleUpdateWeapon(id: string, partyShortcode: string) {
 *     updateWeapon.mutate({
 *       id,
 *       partyShortcode,
 *       updates: { element: 2 }
 *     })
 *   }
 * </script>
 * ```
 */
export function useUpdateGridWeapon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({ id, updates }: { id: string; partyShortcode: string; updates: Partial<GridWeapon> }) =>
			gridAdapter.updateWeapon(id, updates),
		onMutate: async ({ id, partyShortcode, updates }) => {
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
		onError: (_err, { partyShortcode }, context) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(partyShortcode), context.previousParty)
			}
		},
		onSettled: (_data, _err, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Delete grid weapon mutation
 *
 * Removes a weapon from a party's grid.
 */
export function useDeleteGridWeapon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: { id?: string; partyId: string; partyShortcode: string; position?: number }) =>
			gridAdapter.deleteWeapon({ id: params.id, partyId: params.partyId, position: params.position }),
		onMutate: async ({ partyShortcode, id, position }) => {
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
		onError: (_err, { partyShortcode }, context) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(partyShortcode), context.previousParty)
			}
		},
		onSettled: (_data, _err, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Update weapon uncap mutation
 *
 * Updates a weapon's uncap level with optimistic updates.
 */
export function useUpdateWeaponUncap() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: UpdateUncapParams & { partyShortcode: string }) =>
			gridAdapter.updateWeaponUncap(params),
		onMutate: async ({ partyShortcode, id, uncapLevel, transcendenceStep }) => {
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
		onError: (_err, { partyShortcode }, context) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(partyShortcode), context.previousParty)
			}
		},
		onSettled: (_data, _err, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Resolve weapon conflict mutation
 *
 * Resolves conflicts when adding a weapon that conflicts with existing weapons.
 */
export function useResolveWeaponConflict() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: ResolveConflictParams & { partyShortcode: string }) =>
			gridAdapter.resolveWeaponConflict(params),
		onSuccess: (_data, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Swap weapon positions mutation
 *
 * Swaps the positions of two weapons in the grid.
 */
export function useSwapWeapons() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: SwapPositionsParams & { partyShortcode: string }) =>
			gridAdapter.swapWeapons(params),
		onSuccess: (_data, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

// ============================================================================
// Character Mutations
// ============================================================================

/**
 * Create grid character mutation
 *
 * Adds a character to a party's grid.
 */
export function useCreateGridCharacter() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: createGridMutation((params: CreateGridCharacterParams, headers?: Record<string, string>) =>
			gridAdapter.createCharacter(params, headers)
		),
		onSuccess: (_data, params) => {
			invalidateParty(queryClient, params.partyId)
		}
	}))
}

/**
 * Update grid character mutation
 *
 * Updates a character in a party's grid with optimistic updates.
 */
export function useUpdateGridCharacter() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({ id, updates }: { id: string; partyShortcode: string; updates: Partial<GridCharacter> }) =>
			gridAdapter.updateCharacter(id, updates),
		onMutate: async ({ id, partyShortcode, updates }) => {
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
		onError: (_err, { partyShortcode }, context) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(partyShortcode), context.previousParty)
			}
		},
		onSettled: (_data, _err, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Delete grid character mutation
 *
 * Removes a character from a party's grid.
 */
export function useDeleteGridCharacter() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: { id?: string; partyId: string; partyShortcode: string; position?: number }) =>
			gridAdapter.deleteCharacter({ id: params.id, partyId: params.partyId, position: params.position }),
		onMutate: async ({ partyShortcode, id, position }) => {
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
		onError: (_err, { partyShortcode }, context) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(partyShortcode), context.previousParty)
			}
		},
		onSettled: (_data, _err, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Update character uncap mutation
 *
 * Updates a character's uncap level with optimistic updates.
 */
export function useUpdateCharacterUncap() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: UpdateUncapParams & { partyShortcode: string }) =>
			gridAdapter.updateCharacterUncap(params),
		onMutate: async ({ partyShortcode, id, uncapLevel, transcendenceStep }) => {
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
		onError: (_err, { partyShortcode }, context) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(partyShortcode), context.previousParty)
			}
		},
		onSettled: (_data, _err, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Resolve character conflict mutation
 *
 * Resolves conflicts when adding a character that conflicts with existing characters.
 */
export function useResolveCharacterConflict() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: ResolveConflictParams & { partyShortcode: string }) =>
			gridAdapter.resolveCharacterConflict(params),
		onSuccess: (_data, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Swap character positions mutation
 *
 * Swaps the positions of two characters in the grid.
 */
export function useSwapCharacters() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: SwapPositionsParams & { partyShortcode: string }) =>
			gridAdapter.swapCharacters(params),
		onSuccess: (_data, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

// ============================================================================
// Summon Mutations
// ============================================================================

/**
 * Create grid summon mutation
 *
 * Adds a summon to a party's grid.
 */
export function useCreateGridSummon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: createGridMutation((params: CreateGridSummonParams, headers?: Record<string, string>) =>
			gridAdapter.createSummon(params, headers)
		),
		onSuccess: (_data, params) => {
			invalidateParty(queryClient, params.partyId)
		}
	}))
}

/**
 * Update grid summon mutation
 *
 * Updates a summon in a party's grid with optimistic updates.
 */
export function useUpdateGridSummon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({ id, updates }: { id: string; partyShortcode: string; updates: Partial<GridSummon> }) =>
			gridAdapter.updateSummon(id, updates),
		onMutate: async ({ id, partyShortcode, updates }) => {
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
		onError: (_err, { partyShortcode }, context) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(partyShortcode), context.previousParty)
			}
		},
		onSettled: (_data, _err, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Delete grid summon mutation
 *
 * Removes a summon from a party's grid.
 */
export function useDeleteGridSummon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: { id?: string; partyId: string; partyShortcode: string; position?: number }) =>
			gridAdapter.deleteSummon({ id: params.id, partyId: params.partyId, position: params.position }),
		onMutate: async ({ partyShortcode, id, position }) => {
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
		onError: (_err, { partyShortcode }, context) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(partyShortcode), context.previousParty)
			}
		},
		onSettled: (_data, _err, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Update summon uncap mutation
 *
 * Updates a summon's uncap level with optimistic updates.
 */
export function useUpdateSummonUncap() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: UpdateUncapParams & { partyShortcode: string }) =>
			gridAdapter.updateSummonUncap(params),
		onMutate: async ({ partyShortcode, id, uncapLevel, transcendenceStep }) => {
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
		onError: (_err, { partyShortcode }, context) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(partyShortcode), context.previousParty)
			}
		},
		onSettled: (_data, _err, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Update quick summon mutation
 *
 * Updates a summon's quick summon setting with optimistic updates.
 */
export function useUpdateQuickSummon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
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
		onMutate: async ({ partyShortcode, id, quickSummon }) => {
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
		onError: (_err, { partyShortcode }, context) => {
			if (context?.previousParty) {
				queryClient.setQueryData(partyKeys.detail(partyShortcode), context.previousParty)
			}
		},
		onSettled: (_data, _err, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Swap summon positions mutation
 *
 * Swaps the positions of two summons in the grid.
 */
export function useSwapSummons() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: SwapPositionsParams & { partyShortcode: string }) =>
			gridAdapter.swapSummons(params),
		onSuccess: (_data, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

// ============================================================================
// Sync Mutations (Collection -> Grid)
// ============================================================================

/**
 * Sync grid character from collection mutation
 *
 * Syncs a grid character's customizations from its linked collection source.
 */
export function useSyncGridCharacter() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: { id: string; partyShortcode: string }) =>
			gridAdapter.syncCharacter(params.id),
		onSuccess: (_data, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Sync grid weapon from collection mutation
 *
 * Syncs a grid weapon's customizations from its linked collection source.
 */
export function useSyncGridWeapon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: { id: string; partyShortcode: string }) =>
			gridAdapter.syncWeapon(params.id),
		onSuccess: (_data, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Sync grid summon from collection mutation
 *
 * Syncs a grid summon's customizations from its linked collection source.
 */
export function useSyncGridSummon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: { id: string; partyShortcode: string }) =>
			gridAdapter.syncSummon(params.id),
		onSuccess: (_data, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Sync all party items from collection mutation
 *
 * Syncs all linked grid items in a party from their collection sources.
 */
export function useSyncAllPartyItems() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: { partyId: string; partyShortcode: string }) =>
			gridAdapter.syncAllPartyItems(params.partyId),
		onSuccess: (_data, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Unlink all collection sources from a party's grid items.
 *
 * Keeps the grid items but removes their collection references and clears the collection source user.
 */
export function useUnlinkCollectionSource() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: { partyId: string; partyShortcode: string }) =>
			gridAdapter.unlinkCollectionSource(params.partyId),
		onSuccess: (_data, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}
