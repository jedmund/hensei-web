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
	type UpdatePositionParams,
	type SwapPositionsParams
} from '$lib/api/adapters/grid.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party, GridWeapon, GridCharacter, GridSummon } from '$lib/types/api/party'

// ============================================================================
// Weapon Mutations
// ============================================================================

/**
 * Create grid weapon mutation
 *
 * Adds a weapon to a party's grid and returns the updated party.
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
 *       position: 1,
 *       partyShortcode: 'abc123'
 *     })
 *   }
 * </script>
 * ```
 */
export function useCreateGridWeapon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: async (params: CreateGridWeaponParams & { partyShortcode: string }): Promise<Party> => {
			await gridAdapter.createWeapon(params)
			// Invalidate and refetch the party to get the updated state
			await queryClient.invalidateQueries({ queryKey: partyKeys.detail(params.partyShortcode) })
			const updatedParty = await queryClient.fetchQuery<Party>({ queryKey: partyKeys.detail(params.partyShortcode) })
			return updatedParty
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
 * Removes a weapon from a party's grid and returns the updated party.
 */
export function useDeleteGridWeapon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: async (params: { id?: string; partyId: string; partyShortcode: string; position?: number }): Promise<Party> => {
			await gridAdapter.deleteWeapon({ id: params.id, partyId: params.partyId, position: params.position })
			// Invalidate and refetch the party to get the updated state
			await queryClient.invalidateQueries({ queryKey: partyKeys.detail(params.partyShortcode) })
			const updatedParty = await queryClient.fetchQuery<Party>({ queryKey: partyKeys.detail(params.partyShortcode) })
			return updatedParty
		},
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

// ============================================================================
// Character Mutations
// ============================================================================

/**
 * Create grid character mutation
 *
 * Adds a character to a party's grid and returns the updated party.
 */
export function useCreateGridCharacter() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: async (params: CreateGridCharacterParams & { partyShortcode: string }): Promise<Party> => {
			await gridAdapter.createCharacter(params)
			// Invalidate and refetch the party to get the updated state
			await queryClient.invalidateQueries({ queryKey: partyKeys.detail(params.partyShortcode) })
			const updatedParty = await queryClient.fetchQuery<Party>({ queryKey: partyKeys.detail(params.partyShortcode) })
			return updatedParty
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
 * Removes a character from a party's grid and returns the updated party.
 */
export function useDeleteGridCharacter() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: async (params: { id?: string; partyId: string; partyShortcode: string; position?: number }): Promise<Party> => {
			await gridAdapter.deleteCharacter({ id: params.id, partyId: params.partyId, position: params.position })
			// Invalidate and refetch the party to get the updated state
			await queryClient.invalidateQueries({ queryKey: partyKeys.detail(params.partyShortcode) })
			const updatedParty = await queryClient.fetchQuery<Party>({ queryKey: partyKeys.detail(params.partyShortcode) })
			return updatedParty
		},
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

// ============================================================================
// Summon Mutations
// ============================================================================

/**
 * Create grid summon mutation
 *
 * Adds a summon to a party's grid and returns the updated party.
 */
export function useCreateGridSummon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: async (params: CreateGridSummonParams & { partyShortcode: string }): Promise<Party> => {
			await gridAdapter.createSummon(params)
			// Invalidate and refetch the party to get the updated state
			await queryClient.invalidateQueries({ queryKey: partyKeys.detail(params.partyShortcode) })
			const updatedParty = await queryClient.fetchQuery<Party>({ queryKey: partyKeys.detail(params.partyShortcode) })
			return updatedParty
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
 * Removes a summon from a party's grid and returns the updated party.
 */
export function useDeleteGridSummon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: async (params: { id?: string; partyId: string; partyShortcode: string; position?: number }): Promise<Party> => {
			await gridAdapter.deleteSummon({ id: params.id, partyId: params.partyId, position: params.position })
			// Invalidate and refetch the party to get the updated state
			await queryClient.invalidateQueries({ queryKey: partyKeys.detail(params.partyShortcode) })
			const updatedParty = await queryClient.fetchQuery<Party>({ queryKey: partyKeys.detail(params.partyShortcode) })
			return updatedParty
		},
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

// ============================================================================
// Position/Move Mutations
// ============================================================================

/**
 * Move weapon position mutation
 *
 * Updates a weapon's position in the grid.
 */
export function useMoveWeapon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: UpdatePositionParams & { partyShortcode: string }) =>
			gridAdapter.updateWeaponPosition(params),
		onSuccess: (_data, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Swap weapons mutation
 *
 * Swaps two weapons' positions in the grid.
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

/**
 * Move character position mutation
 *
 * Updates a character's position in the grid.
 */
export function useMoveCharacter() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: UpdatePositionParams & { partyShortcode: string }) =>
			gridAdapter.updateCharacterPosition(params),
		onSuccess: (_data, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Swap characters mutation
 *
 * Swaps two characters' positions in the grid.
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

/**
 * Move summon position mutation
 *
 * Updates a summon's position in the grid.
 */
export function useMoveSummon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: UpdatePositionParams & { partyShortcode: string }) =>
			gridAdapter.updateSummonPosition(params),
		onSuccess: (_data, { partyShortcode }) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
		}
	}))
}

/**
 * Swap summons mutation
 *
 * Swaps two summons' positions in the grid.
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
