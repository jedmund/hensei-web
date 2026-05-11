/**
 * Substitution Mutation Configurations
 *
 * Provides mutation configurations for substitution operations
 * with cache invalidation using TanStack Query v6.
 *
 * @module api/mutations/substitution
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import {
	substitutionAdapter,
	type CreateSubstitutionParams,
	type ReorderSubstitutionEntry
} from '$lib/api/adapters/substitution.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import { getEditKey } from '$lib/utils/editKeys'

function editKeyHeaders(partyShortcode: string): Record<string, string> | undefined {
	const editKey = getEditKey(partyShortcode)
	return editKey ? { 'X-Edit-Key': editKey } : undefined
}

function invalidateOnSettled(queryClient: QueryClient, partyShortcode: string) {
	queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
}

// ============================================================================
// Create Substitution
// ============================================================================

export function createSubstitutionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: CreateSubstitutionParams & { partyShortcode: string }) =>
			substitutionAdapter.createSubstitution(params, editKeyHeaders(params.partyShortcode)),
		onSuccess: (_data: unknown, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function useCreateSubstitution() {
	const queryClient = useQueryClient()
	return createMutation(() => createSubstitutionOptions(queryClient))
}

// ============================================================================
// Update Substitution
// ============================================================================

export function updateSubstitutionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: {
			id: string
			partyId: string
			partyShortcode: string
			position: number
		}) =>
			substitutionAdapter.updateSubstitution(
				params.id,
				{ partyId: params.partyId, position: params.position },
				editKeyHeaders(params.partyShortcode)
			),
		onSuccess: (_data: unknown, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function useUpdateSubstitution() {
	const queryClient = useQueryClient()
	return createMutation(() => updateSubstitutionOptions(queryClient))
}

// ============================================================================
// Delete Substitution
// ============================================================================

export function deleteSubstitutionOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id: string; partyId: string; partyShortcode: string }) =>
			substitutionAdapter.deleteSubstitution(
				params.id,
				params.partyId,
				editKeyHeaders(params.partyShortcode)
			),
		onSuccess: (_data: unknown, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function useDeleteSubstitution() {
	const queryClient = useQueryClient()
	return createMutation(() => deleteSubstitutionOptions(queryClient))
}

// ============================================================================
// Reorder Substitutions (batch)
// ============================================================================

export function reorderSubstitutionsOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: {
			partyId: string
			partyShortcode: string
			entries: ReorderSubstitutionEntry[]
		}) =>
			substitutionAdapter.reorderSubstitutions(
				params.partyId,
				params.entries,
				editKeyHeaders(params.partyShortcode)
			),
		onSuccess: (_data: unknown, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

export function useReorderSubstitutions() {
	const queryClient = useQueryClient()
	return createMutation(() => reorderSubstitutionsOptions(queryClient))
}
