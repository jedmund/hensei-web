/**
 * Grid summon mutation configurations: create, update, delete, uncap,
 * quick summon, swap and duplicate, with optimistic updates.
 *
 * Each mutation exports both an options factory (for testing) and a hook (for components).
 *
 * @module api/mutations/gridSummon
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import {
	gridAdapter,
	type CreateGridSummonParams,
	type UpdateUncapParams,
	type SwapPositionsParams
} from '$lib/api/adapters/grid.adapter'
import type { GridSummon } from '$lib/types/api/party'
import {
	applyGridUncap,
	applyNotesSyncedUpdate,
	editKeyHeaders,
	invalidatePartyOnSuccess,
	optimisticGridList,
	removeGridItem,
	type DeleteGridItemVars,
	type GridSlotVars
} from './gridShared'

type CreateVars = CreateGridSummonParams & { partyShortcode: string }
type UpdateVars = { id: string; partyShortcode: string; updates: Partial<GridSummon> }
type QuickSummonVars = DeleteGridItemVars & { quickSummon: boolean }

export function createGridSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ partyShortcode, ...rest }: CreateVars) =>
			gridAdapter.createSummon(rest, editKeyHeaders(partyShortcode)),
		// Clear the slot being filled; main and friend summons have their own slots.
		...optimisticGridList(
			queryClient,
			'summons',
			(summons, { position, main, friend }: CreateVars) =>
				summons.filter((s) => (main ? !s.main : friend ? !s.friend : s.position !== position))
		)
	}
}

export function updateGridSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, partyShortcode, updates }: UpdateVars) =>
			gridAdapter.updateSummon(id, updates, editKeyHeaders(partyShortcode)),
		...optimisticGridList(queryClient, 'summons', (summons, { id, updates }: UpdateVars) =>
			applyNotesSyncedUpdate(summons, id, updates, (s) => s.summon?.granblueId)
		)
	}
}

export function deleteGridSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: DeleteGridItemVars) =>
			gridAdapter.deleteSummon(
				{ id: params.id, partyId: params.partyId, position: params.position },
				editKeyHeaders(params.partyShortcode)
			),
		...optimisticGridList(queryClient, 'summons', (summons, vars: GridSlotVars) =>
			removeGridItem(summons, vars)
		)
	}
}

export function updateSummonUncapOptions(queryClient: QueryClient) {
	type Vars = UpdateUncapParams & { partyShortcode: string }
	return {
		mutationFn: (params: Vars) =>
			gridAdapter.updateSummonUncap(params, editKeyHeaders(params.partyShortcode)),
		...optimisticGridList(queryClient, 'summons', (summons, vars: Vars) =>
			applyGridUncap(summons, vars)
		)
	}
}

export function updateQuickSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: QuickSummonVars) =>
			gridAdapter.updateQuickSummon(
				{
					id: params.id,
					partyId: params.partyId,
					position: params.position,
					quickSummon: params.quickSummon
				},
				editKeyHeaders(params.partyShortcode)
			),
		...optimisticGridList(
			queryClient,
			'summons',
			(summons, { id, quickSummon }: GridSlotVars & { quickSummon: boolean }) =>
				summons.map((s) => (s.id === id ? { ...s, quickSummon } : s))
		)
	}
}

export function swapSummonsOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: SwapPositionsParams & { partyShortcode: string }) =>
			gridAdapter.swapSummons(params, editKeyHeaders(params.partyShortcode)),
		...invalidatePartyOnSuccess(queryClient)
	}
}

export function duplicateGridSummonOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id: string; partyShortcode: string; position: number }) =>
			gridAdapter.duplicateSummon(
				{ id: params.id, position: params.position },
				editKeyHeaders(params.partyShortcode)
			),
		...invalidatePartyOnSuccess(queryClient)
	}
}

// ============================================================================
// Svelte Hooks (thin wrappers for component use)
// ============================================================================

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
