/**
 * Grid character mutation configurations: create, update, delete, uncap,
 * conflict resolution, swap and style switch, with optimistic updates.
 *
 * Each mutation exports both an options factory (for testing) and a hook (for components).
 *
 * @module api/mutations/gridCharacter
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import {
	gridCharacterAdapter,
	type CreateGridCharacterParams
} from '$lib/api/adapters/gridCharacter.adapter'
import type {
	UpdateUncapParams,
	ResolveConflictParams,
	SwapPositionsParams
} from '$lib/api/adapters/grid.shared'
import type { GridCharacter } from '$lib/types/api/party'
import {
	applyGridUncap,
	editKeyHeaders,
	invalidatePartyOnSuccess,
	optimisticGridList,
	removeGridItem,
	type DeleteGridItemVars,
	type GridSlotVars
} from './gridShared'

type CreateVars = CreateGridCharacterParams & { partyShortcode: string }
type UpdateVars = { id: string; partyShortcode: string; updates: Partial<GridCharacter> }

export function createGridCharacterOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ partyShortcode, ...rest }: CreateVars) =>
			gridCharacterAdapter.createCharacter(rest, editKeyHeaders(partyShortcode)),
		...optimisticGridList(queryClient, 'characters', (characters, { position }: CreateVars) =>
			characters.filter((c) => c.position !== position)
		)
	}
}

export function updateGridCharacterOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, partyShortcode, updates }: UpdateVars) =>
			gridCharacterAdapter.updateCharacter(id, updates, editKeyHeaders(partyShortcode)),
		// Characters have no notes sync, so the edit only touches the target.
		...optimisticGridList(queryClient, 'characters', (characters, { id, updates }: UpdateVars) =>
			characters.map((c) => (c.id === id ? { ...c, ...updates } : c))
		)
	}
}

export function deleteGridCharacterOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: DeleteGridItemVars) =>
			gridCharacterAdapter.deleteCharacter(
				{ id: params.id, partyId: params.partyId, position: params.position },
				editKeyHeaders(params.partyShortcode)
			),
		...optimisticGridList(queryClient, 'characters', (characters, vars: GridSlotVars) =>
			removeGridItem(characters, vars)
		)
	}
}

export function updateCharacterUncapOptions(queryClient: QueryClient) {
	type Vars = UpdateUncapParams & { partyShortcode: string }
	return {
		mutationFn: (params: Vars) =>
			gridCharacterAdapter.updateCharacterUncap(params, editKeyHeaders(params.partyShortcode)),
		...optimisticGridList(queryClient, 'characters', (characters, vars: Vars) =>
			applyGridUncap(characters, vars)
		)
	}
}

export function resolveCharacterConflictOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: ResolveConflictParams & { partyShortcode: string }) =>
			gridCharacterAdapter.resolveCharacterConflict(params, editKeyHeaders(params.partyShortcode)),
		...invalidatePartyOnSuccess(queryClient)
	}
}

export function swapCharactersOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: SwapPositionsParams & { partyShortcode: string }) =>
			gridCharacterAdapter.swapCharacters(params, editKeyHeaders(params.partyShortcode)),
		...invalidatePartyOnSuccess(queryClient)
	}
}

export function switchCharacterStyleOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id: string; partyShortcode: string }) =>
			gridCharacterAdapter.switchCharacterStyle(params.id, editKeyHeaders(params.partyShortcode)),
		...invalidatePartyOnSuccess(queryClient)
	}
}

// ============================================================================
// Svelte Hooks (thin wrappers for component use)
// ============================================================================

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

export function useSwitchCharacterStyle() {
	const queryClient = useQueryClient()
	return createMutation(() => switchCharacterStyleOptions(queryClient))
}
