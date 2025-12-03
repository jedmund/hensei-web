/**
 * Collection Mutation Configurations
 *
 * Provides mutation configurations for collection operations
 * with cache invalidation using TanStack Query v6.
 *
 * @module api/mutations/collection
 */

import { useQueryClient, createMutation } from '@tanstack/svelte-query'
import { collectionAdapter } from '$lib/api/adapters/collection.adapter'
import { collectionKeys } from '$lib/api/queries/collection.queries'
import type {
	CollectionCharacter,
	CollectionCharacterInput,
	CollectionWeaponInput,
	CollectionSummonInput,
	CollectionJobAccessoryInput
} from '$lib/types/api/collection'

// ============================================================================
// Character Mutations
// ============================================================================

/**
 * Add characters to collection mutation
 *
 * Adds one or more characters to the user's collection.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useAddToCollection } from '$lib/api/mutations/collection.mutations'
 *
 *   const addToCollection = useAddToCollection()
 *
 *   function handleAdd(characterIds: string[]) {
 *     addToCollection.mutate(
 *       characterIds.map(id => ({ characterId: id }))
 *     )
 *   }
 * </script>
 * ```
 */
export function useAddCharactersToCollection() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (inputs: CollectionCharacterInput[]) => collectionAdapter.addCharacters(inputs),
		onSuccess: () => {
			// Invalidate all character-related collection queries
			queryClient.invalidateQueries({ queryKey: collectionKeys.characters() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.characterIds() })
		}
	}))
}

/**
 * Add single character to collection mutation
 */
export function useAddCharacterToCollection() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (input: CollectionCharacterInput) => collectionAdapter.addCharacter(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.characters() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.characterIds() })
		}
	}))
}

/**
 * Update collection character mutation
 *
 * Updates a character's customizations (uncap, rings, etc.) in the collection.
 */
export function useUpdateCollectionCharacter() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({ id, input }: { id: string; input: Partial<CollectionCharacterInput> }) =>
			collectionAdapter.updateCharacter(id, input),
		onMutate: async ({ id, input }) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: collectionKeys.character(id) })

			// Snapshot the previous value
			const previousCharacter = queryClient.getQueryData<CollectionCharacter>(
				collectionKeys.character(id)
			)

			// Optimistically update the cache
			if (previousCharacter) {
				queryClient.setQueryData(collectionKeys.character(id), {
					...previousCharacter,
					...input
				})
			}

			return { previousCharacter }
		},
		onError: (_err, { id }, context) => {
			// Rollback on error
			if (context?.previousCharacter) {
				queryClient.setQueryData(collectionKeys.character(id), context.previousCharacter)
			}
		},
		onSettled: (_data, _err, { id }) => {
			// Always refetch after mutation
			queryClient.invalidateQueries({ queryKey: collectionKeys.character(id) })
			queryClient.invalidateQueries({ queryKey: collectionKeys.characters() })
		}
	}))
}

/**
 * Remove character from collection mutation
 */
export function useRemoveCharacterFromCollection() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (id: string) => collectionAdapter.removeCharacter(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.characters() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.characterIds() })
		}
	}))
}

// ============================================================================
// Weapon Mutations
// ============================================================================

/**
 * Add weapon to collection mutation
 */
export function useAddWeaponToCollection() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (input: CollectionWeaponInput) => collectionAdapter.addWeapon(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.weapons() })
		}
	}))
}

/**
 * Add multiple weapons to collection mutation with quantity support
 */
export function useAddWeaponsToCollection() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (inputs: Array<CollectionWeaponInput & { quantity?: number }>) =>
			collectionAdapter.addWeapons(inputs),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.weapons() })
		}
	}))
}

/**
 * Update collection weapon mutation
 */
export function useUpdateCollectionWeapon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({ id, input }: { id: string; input: Partial<CollectionWeaponInput> }) =>
			collectionAdapter.updateWeapon(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.weapons() })
		}
	}))
}

/**
 * Remove weapon from collection mutation
 */
export function useRemoveWeaponFromCollection() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (id: string) => collectionAdapter.removeWeapon(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.weapons() })
		}
	}))
}

// ============================================================================
// Summon Mutations
// ============================================================================

/**
 * Add summon to collection mutation
 */
export function useAddSummonToCollection() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (input: CollectionSummonInput) => collectionAdapter.addSummon(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.summons() })
		}
	}))
}

/**
 * Add multiple summons to collection mutation with quantity support
 */
export function useAddSummonsToCollection() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (inputs: Array<CollectionSummonInput & { quantity?: number }>) =>
			collectionAdapter.addSummons(inputs),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.summons() })
		}
	}))
}

/**
 * Update collection summon mutation
 */
export function useUpdateCollectionSummon() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({ id, input }: { id: string; input: Partial<CollectionSummonInput> }) =>
			collectionAdapter.updateSummon(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.summons() })
		}
	}))
}

/**
 * Remove summon from collection mutation
 */
export function useRemoveSummonFromCollection() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (id: string) => collectionAdapter.removeSummon(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.summons() })
		}
	}))
}

// ============================================================================
// Job Accessory Mutations
// ============================================================================

/**
 * Add job accessory to collection mutation
 */
export function useAddJobAccessoryToCollection() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (input: CollectionJobAccessoryInput) => collectionAdapter.addJobAccessory(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.all })
		}
	}))
}

/**
 * Remove job accessory from collection mutation
 */
export function useRemoveJobAccessoryFromCollection() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (id: string) => collectionAdapter.removeJobAccessory(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.all })
		}
	}))
}
