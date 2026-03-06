/**
 * Artifact Mutation Configurations
 *
 * Provides mutation configurations for artifact operations
 * with cache invalidation using TanStack Query v6.
 *
 * Each mutation exports both an options factory (for testing) and a hook (for components).
 *
 * @module api/mutations/artifact
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { artifactAdapter } from '$lib/api/adapters/artifact.adapter'
import { artifactKeys } from '$lib/api/queries/artifact.queries'
import type {
	CollectionArtifactInput,
	GridArtifactInput,
	GridArtifactUpdateInput,
	ArtifactGradeInput
} from '$lib/types/api/artifact'

// ============================================================================
// Options Factories — Collection Artifacts
// ============================================================================

export function createCollectionArtifactOptions(queryClient: QueryClient) {
	return {
		mutationFn: (input: CollectionArtifactInput) =>
			artifactAdapter.createCollectionArtifact(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: artifactKeys.collectionBase })
		}
	}
}

export function createCollectionArtifactsBatchOptions(queryClient: QueryClient) {
	return {
		mutationFn: (inputs: CollectionArtifactInput[]) =>
			artifactAdapter.createCollectionArtifactsBatch(inputs),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: artifactKeys.collectionBase })
		}
	}
}

export function updateCollectionArtifactOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, input }: { id: string; input: Partial<CollectionArtifactInput> }) =>
			artifactAdapter.updateCollectionArtifact(id, input),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: artifactKeys.collectionBase })
		}
	}
}

export function deleteCollectionArtifactOptions(queryClient: QueryClient) {
	return {
		mutationFn: (id: string) => artifactAdapter.deleteCollectionArtifact(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: artifactKeys.collectionBase })
		}
	}
}

export function bulkDeleteCollectionArtifactsOptions(queryClient: QueryClient) {
	return {
		mutationFn: (ids: string[]) => artifactAdapter.deleteCollectionArtifactsBatch(ids),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: artifactKeys.collectionBase })
		}
	}
}

// ============================================================================
// Options Factories — Grid Artifacts
// ============================================================================

export function createGridArtifactOptions(queryClient: QueryClient) {
	return {
		mutationFn: (input: GridArtifactInput) => artifactAdapter.createGridArtifact(input),
		onSuccess: (_data: unknown, input: GridArtifactInput) => {
			queryClient.invalidateQueries({ queryKey: ['parties', input.partyId] })
		}
	}
}

export function updateGridArtifactOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, input }: { id: string; input: GridArtifactUpdateInput }) =>
			artifactAdapter.updateGridArtifact(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['parties'] })
		}
	}
}

export function deleteGridArtifactOptions(queryClient: QueryClient) {
	return {
		mutationFn: (id: string) => artifactAdapter.deleteGridArtifact(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['parties'] })
		}
	}
}

export function equipCollectionArtifactOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			partyId,
			gridCharacterId,
			collectionArtifactId
		}: {
			partyId: string
			gridCharacterId: string
			collectionArtifactId: string
		}) => artifactAdapter.equipCollectionArtifact(partyId, gridCharacterId, collectionArtifactId),
		onSuccess: (_data: unknown, { partyId }: { partyId: string; gridCharacterId: string; collectionArtifactId: string }) => {
			queryClient.invalidateQueries({ queryKey: ['parties', partyId] })
		}
	}
}

// ============================================================================
// Options Factories — Grading & Sync
// ============================================================================

export function gradeArtifactOptions() {
	return {
		mutationFn: (input: ArtifactGradeInput) => artifactAdapter.gradeArtifact(input)
	}
}

export function syncGridArtifactOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id: string; partyShortcode: string }) =>
			artifactAdapter.syncGridArtifact(params.id),
		onSuccess: (_data: unknown, { partyShortcode }: { id: string; partyShortcode: string }) => {
			queryClient.invalidateQueries({ queryKey: ['parties', 'detail', partyShortcode] })
		}
	}
}

// ============================================================================
// Hooks (thin wrappers for component use)
// ============================================================================

export function useCreateCollectionArtifact() {
	const queryClient = useQueryClient()
	return createMutation(() => createCollectionArtifactOptions(queryClient))
}

export function useCreateCollectionArtifactsBatch() {
	const queryClient = useQueryClient()
	return createMutation(() => createCollectionArtifactsBatchOptions(queryClient))
}

export function useUpdateCollectionArtifact() {
	const queryClient = useQueryClient()
	return createMutation(() => updateCollectionArtifactOptions(queryClient))
}

export function useDeleteCollectionArtifact() {
	const queryClient = useQueryClient()
	return createMutation(() => deleteCollectionArtifactOptions(queryClient))
}

export function useBulkDeleteCollectionArtifacts() {
	const queryClient = useQueryClient()
	return createMutation(() => bulkDeleteCollectionArtifactsOptions(queryClient))
}

export function useCreateGridArtifact() {
	const queryClient = useQueryClient()
	return createMutation(() => createGridArtifactOptions(queryClient))
}

export function useUpdateGridArtifact() {
	const queryClient = useQueryClient()
	return createMutation(() => updateGridArtifactOptions(queryClient))
}

export function useDeleteGridArtifact() {
	const queryClient = useQueryClient()
	return createMutation(() => deleteGridArtifactOptions(queryClient))
}

export function useEquipCollectionArtifact() {
	const queryClient = useQueryClient()
	return createMutation(() => equipCollectionArtifactOptions(queryClient))
}

export function useGradeArtifact() {
	return createMutation(() => gradeArtifactOptions())
}

export function useSyncGridArtifact() {
	const queryClient = useQueryClient()
	return createMutation(() => syncGridArtifactOptions(queryClient))
}
