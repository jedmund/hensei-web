/**
 * Artifact Mutation Configurations
 *
 * Provides mutation configurations for artifact operations
 * with cache invalidation using TanStack Query v6.
 *
 * @module api/mutations/artifact
 */

import { useQueryClient, createMutation } from '@tanstack/svelte-query'
import { artifactAdapter } from '$lib/api/adapters/artifact.adapter'
import { artifactKeys } from '$lib/api/queries/artifact.queries'
import type {
	CollectionArtifact,
	CollectionArtifactInput,
	GridArtifact,
	GridArtifactInput,
	GridArtifactUpdateInput,
	ArtifactGrade,
	ArtifactGradeInput
} from '$lib/types/api/artifact'

// ============================================================================
// Collection Artifact Mutations
// ============================================================================

/**
 * Create a collection artifact mutation
 *
 * Adds a single artifact to the user's collection.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useCreateCollectionArtifact } from '$lib/api/mutations/artifact.mutations'
 *
 *   const createArtifact = useCreateCollectionArtifact()
 *
 *   function handleCreate(input: CollectionArtifactInput) {
 *     createArtifact.mutate(input)
 *   }
 * </script>
 * ```
 */
export function useCreateCollectionArtifact() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (input: CollectionArtifactInput) =>
			artifactAdapter.createCollectionArtifact(input),
		onSuccess: () => {
			// Invalidate all collection artifact queries
			queryClient.invalidateQueries({ queryKey: artifactKeys.collectionBase })
		}
	}))
}

/**
 * Create multiple collection artifacts in a batch
 */
export function useCreateCollectionArtifactsBatch() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (inputs: CollectionArtifactInput[]) =>
			artifactAdapter.createCollectionArtifactsBatch(inputs),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: artifactKeys.collectionBase })
		}
	}))
}

/**
 * Update a collection artifact mutation
 *
 * Updates an artifact's properties (skills, level, nickname, etc.)
 * Includes optimistic updates for better UX.
 */
export function useUpdateCollectionArtifact() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({ id, input }: { id: string; input: Partial<CollectionArtifactInput> }) =>
			artifactAdapter.updateCollectionArtifact(id, input),
		onSettled: () => {
			// Invalidate collection list to reflect changes
			queryClient.invalidateQueries({ queryKey: artifactKeys.collectionBase })
		}
	}))
}

/**
 * Delete a collection artifact mutation
 */
export function useDeleteCollectionArtifact() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (id: string) => artifactAdapter.deleteCollectionArtifact(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: artifactKeys.collectionBase })
		}
	}))
}

// ============================================================================
// Grid Artifact Mutations (Equipped on Characters)
// ============================================================================

/**
 * Create a grid artifact mutation
 *
 * Creates a new artifact and equips it on a character in a party.
 */
export function useCreateGridArtifact() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (input: GridArtifactInput) => artifactAdapter.createGridArtifact(input),
		onSuccess: (_data, input) => {
			// Invalidate party queries to reflect the new artifact
			queryClient.invalidateQueries({ queryKey: ['parties', input.partyId] })
		}
	}))
}

/**
 * Update a grid artifact mutation
 *
 * Updates an artifact equipped on a character.
 */
export function useUpdateGridArtifact() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({ id, input }: { id: string; input: GridArtifactUpdateInput }) =>
			artifactAdapter.updateGridArtifact(id, input),
		onSuccess: () => {
			// Invalidate party queries to reflect the updated artifact
			queryClient.invalidateQueries({ queryKey: ['parties'] })
		}
	}))
}

/**
 * Delete a grid artifact mutation
 *
 * Removes an artifact from a character.
 */
export function useDeleteGridArtifact() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (id: string) => artifactAdapter.deleteGridArtifact(id),
		onSuccess: () => {
			// Invalidate party queries to reflect the removal
			queryClient.invalidateQueries({ queryKey: ['parties'] })
		}
	}))
}

/**
 * Equip a collection artifact onto a character
 *
 * Links an existing collection artifact to a character in a party.
 */
export function useEquipCollectionArtifact() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: ({
			partyId,
			gridCharacterId,
			collectionArtifactId
		}: {
			partyId: string
			gridCharacterId: string
			collectionArtifactId: string
		}) => artifactAdapter.equipCollectionArtifact(partyId, gridCharacterId, collectionArtifactId),
		onSuccess: (_data, { partyId }) => {
			// Invalidate party queries to reflect the equipped artifact
			queryClient.invalidateQueries({ queryKey: ['parties', partyId] })
		}
	}))
}

// ============================================================================
// Artifact Grading (Stateless)
// ============================================================================

/**
 * Grade artifact skills mutation
 *
 * Calculates a grade for artifact skills without persisting.
 * Useful for preview/what-if scenarios.
 */
export function useGradeArtifact() {
	return createMutation(() => ({
		mutationFn: (input: ArtifactGradeInput) => artifactAdapter.gradeArtifact(input)
	}))
}

// ============================================================================
// Sync Mutations (Collection -> Grid)
// ============================================================================

/**
 * Sync grid artifact from collection mutation
 *
 * Syncs a grid artifact's properties from its linked collection source.
 */
export function useSyncGridArtifact() {
	const queryClient = useQueryClient()

	return createMutation(() => ({
		mutationFn: (params: { id: string; partyShortcode: string }) =>
			artifactAdapter.syncGridArtifact(params.id),
		onSuccess: (_data, { partyShortcode }) => {
			// Invalidate party queries to reflect the synced artifact
			queryClient.invalidateQueries({ queryKey: ['parties', 'detail', partyShortcode] })
		}
	}))
}
