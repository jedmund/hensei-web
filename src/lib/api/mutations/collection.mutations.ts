/**
 * Collection Mutation Configurations
 *
 * Provides mutation configurations for collection operations
 * with cache invalidation using TanStack Query v6.
 *
 * Each mutation exports both an options factory (for testing) and a hook (for components).
 *
 * @module api/mutations/collection
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
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
// Options Factories — Characters
// ============================================================================

export function addCharactersToCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (inputs: CollectionCharacterInput[]) => collectionAdapter.addCharacters(inputs),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.characters() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.characterIds() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.countsPrefix })
			queryClient.invalidateQueries({ queryKey: collectionKeys.granblueIdsPrefix })
		}
	}
}

export function addCharacterToCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (input: CollectionCharacterInput) => collectionAdapter.addCharacter(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.characters() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.characterIds() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.countsPrefix })
			queryClient.invalidateQueries({ queryKey: collectionKeys.granblueIdsPrefix })
		}
	}
}

export function updateCollectionCharacterOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, input }: { id: string; input: Partial<CollectionCharacterInput> }) =>
			collectionAdapter.updateCharacter(id, input),
		onMutate: async ({ id, input }: { id: string; input: Partial<CollectionCharacterInput> }) => {
			await queryClient.cancelQueries({ queryKey: collectionKeys.character(id) })

			const previousCharacter = queryClient.getQueryData<CollectionCharacter>(
				collectionKeys.character(id)
			)

			if (previousCharacter) {
				queryClient.setQueryData(collectionKeys.character(id), {
					...previousCharacter,
					...input
				})
			}

			return { previousCharacter }
		},
		onError: (
			_err: unknown,
			{ id }: { id: string; input: Partial<CollectionCharacterInput> },
			context: { previousCharacter?: CollectionCharacter } | undefined
		) => {
			if (context?.previousCharacter) {
				queryClient.setQueryData(collectionKeys.character(id), context.previousCharacter)
			}
		},
		onSettled: (
			_data: unknown,
			_err: unknown,
			{ id }: { id: string; input: Partial<CollectionCharacterInput> }
		) => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.character(id) })
			queryClient.invalidateQueries({ queryKey: collectionKeys.characters() })
		}
	}
}

export function removeCharacterFromCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (id: string) => collectionAdapter.removeCharacter(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.characters() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.characterIds() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.countsPrefix })
			queryClient.invalidateQueries({ queryKey: collectionKeys.granblueIdsPrefix })
		}
	}
}

export function bulkRemoveCharactersFromCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (ids: string[]) => collectionAdapter.removeCharactersBatch(ids),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.characters() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.characterIds() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.countsPrefix })
			queryClient.invalidateQueries({ queryKey: collectionKeys.granblueIdsPrefix })
		}
	}
}

// ============================================================================
// Options Factories — Weapons
// ============================================================================

export function addWeaponToCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (input: CollectionWeaponInput) => collectionAdapter.addWeapon(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.weapons() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.countsPrefix })
			queryClient.invalidateQueries({ queryKey: collectionKeys.granblueIdsPrefix })
		}
	}
}

export function addWeaponsToCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (inputs: Array<CollectionWeaponInput & { quantity?: number }>) =>
			collectionAdapter.addWeapons(inputs),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.weapons() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.countsPrefix })
			queryClient.invalidateQueries({ queryKey: collectionKeys.granblueIdsPrefix })
		}
	}
}

export function updateCollectionWeaponOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, input }: { id: string; input: Partial<CollectionWeaponInput> }) =>
			collectionAdapter.updateWeapon(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.weapons() })
		}
	}
}

export function removeWeaponFromCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (id: string) => collectionAdapter.removeWeapon(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.weapons() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.countsPrefix })
			queryClient.invalidateQueries({ queryKey: collectionKeys.granblueIdsPrefix })
		}
	}
}

export function bulkRemoveWeaponsFromCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (ids: string[]) => collectionAdapter.removeWeaponsBatch(ids),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.weapons() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.countsPrefix })
			queryClient.invalidateQueries({ queryKey: collectionKeys.granblueIdsPrefix })
		}
	}
}

// ============================================================================
// Options Factories — Summons
// ============================================================================

export function addSummonToCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (input: CollectionSummonInput) => collectionAdapter.addSummon(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.summons() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.countsPrefix })
			queryClient.invalidateQueries({ queryKey: collectionKeys.granblueIdsPrefix })
		}
	}
}

export function addSummonsToCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (inputs: Array<CollectionSummonInput & { quantity?: number }>) =>
			collectionAdapter.addSummons(inputs),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.summons() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.countsPrefix })
			queryClient.invalidateQueries({ queryKey: collectionKeys.granblueIdsPrefix })
		}
	}
}

export function updateCollectionSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, input }: { id: string; input: Partial<CollectionSummonInput> }) =>
			collectionAdapter.updateSummon(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.summons() })
		}
	}
}

export function removeSummonFromCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (id: string) => collectionAdapter.removeSummon(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.summons() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.countsPrefix })
			queryClient.invalidateQueries({ queryKey: collectionKeys.granblueIdsPrefix })
		}
	}
}

export function bulkRemoveSummonsFromCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (ids: string[]) => collectionAdapter.removeSummonsBatch(ids),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.summons() })
			queryClient.invalidateQueries({ queryKey: collectionKeys.countsPrefix })
			queryClient.invalidateQueries({ queryKey: collectionKeys.granblueIdsPrefix })
		}
	}
}

// ============================================================================
// Options Factories — Job Accessories
// ============================================================================

export function addJobAccessoryToCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (input: CollectionJobAccessoryInput) => collectionAdapter.addJobAccessory(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.all })
		}
	}
}

export function removeJobAccessoryFromCollectionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (id: string) => collectionAdapter.removeJobAccessory(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionKeys.all })
		}
	}
}

// ============================================================================
// Hooks (thin wrappers for component use)
// ============================================================================

export function useAddCharactersToCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => addCharactersToCollectionOptions(queryClient))
}

export function useAddCharacterToCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => addCharacterToCollectionOptions(queryClient))
}

export function useUpdateCollectionCharacter() {
	const queryClient = useQueryClient()
	return createMutation(() => updateCollectionCharacterOptions(queryClient))
}

export function useRemoveCharacterFromCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => removeCharacterFromCollectionOptions(queryClient))
}

export function useBulkRemoveCharactersFromCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => bulkRemoveCharactersFromCollectionOptions(queryClient))
}

export function useAddWeaponToCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => addWeaponToCollectionOptions(queryClient))
}

export function useAddWeaponsToCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => addWeaponsToCollectionOptions(queryClient))
}

export function useUpdateCollectionWeapon() {
	const queryClient = useQueryClient()
	return createMutation(() => updateCollectionWeaponOptions(queryClient))
}

export function useRemoveWeaponFromCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => removeWeaponFromCollectionOptions(queryClient))
}

export function useBulkRemoveWeaponsFromCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => bulkRemoveWeaponsFromCollectionOptions(queryClient))
}

export function useAddSummonToCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => addSummonToCollectionOptions(queryClient))
}

export function useAddSummonsToCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => addSummonsToCollectionOptions(queryClient))
}

export function useUpdateCollectionSummon() {
	const queryClient = useQueryClient()
	return createMutation(() => updateCollectionSummonOptions(queryClient))
}

export function useRemoveSummonFromCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => removeSummonFromCollectionOptions(queryClient))
}

export function useBulkRemoveSummonsFromCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => bulkRemoveSummonsFromCollectionOptions(queryClient))
}

export function useAddJobAccessoryToCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => addJobAccessoryToCollectionOptions(queryClient))
}

export function useRemoveJobAccessoryFromCollection() {
	const queryClient = useQueryClient()
	return createMutation(() => removeJobAccessoryFromCollectionOptions(queryClient))
}
