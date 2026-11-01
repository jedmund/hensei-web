/**
 * Grid weapon mutation configurations: create, update, delete, uncap,
 * conflict resolution, swap and duplicate, with optimistic updates.
 *
 * Each mutation exports both an options factory (for testing) and a hook (for components).
 *
 * @module api/mutations/gridWeapon
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import {
	gridWeaponAdapter,
	type CreateGridWeaponParams
} from '$lib/api/adapters/gridWeapon.adapter'
import type {
	UpdateUncapParams,
	ResolveConflictParams,
	SwapPositionsParams
} from '$lib/api/adapters/grid.shared'
import type { GridWeapon } from '$lib/types/api/party'
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

type CreateVars = CreateGridWeaponParams & { partyShortcode: string }
type UpdateVars = { id: string; partyShortcode: string; updates: Partial<GridWeapon> }

export function createGridWeaponOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ partyShortcode, ...rest }: CreateVars) =>
			gridWeaponAdapter.createWeapon(rest, editKeyHeaders(partyShortcode)),
		// Clear the slot being filled; the mainhand has its own slot.
		...optimisticGridList(queryClient, 'weapons', (weapons, { position, mainhand }: CreateVars) =>
			weapons.filter((w) => (mainhand ? !w.mainhand : w.position !== position))
		)
	}
}

export function updateGridWeaponOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, partyShortcode, updates }: UpdateVars) =>
			gridWeaponAdapter.updateWeapon(id, updates, editKeyHeaders(partyShortcode)),
		...optimisticGridList(queryClient, 'weapons', (weapons, { id, updates }: UpdateVars) =>
			applyNotesSyncedUpdate(weapons, id, updates, (w) => w.weapon?.granblueId)
		)
	}
}

export function deleteGridWeaponOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: DeleteGridItemVars) =>
			gridWeaponAdapter.deleteWeapon(
				{ id: params.id, partyId: params.partyId, position: params.position },
				editKeyHeaders(params.partyShortcode)
			),
		...optimisticGridList(queryClient, 'weapons', (weapons, vars: GridSlotVars) =>
			removeGridItem(weapons, vars)
		)
	}
}

export function updateWeaponUncapOptions(queryClient: QueryClient) {
	type Vars = UpdateUncapParams & { partyShortcode: string }
	return {
		mutationFn: (params: Vars) =>
			gridWeaponAdapter.updateWeaponUncap(params, editKeyHeaders(params.partyShortcode)),
		...optimisticGridList(queryClient, 'weapons', (weapons, vars: Vars) =>
			applyGridUncap(weapons, vars)
		)
	}
}

export function resolveWeaponConflictOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: ResolveConflictParams & { partyShortcode: string }) =>
			gridWeaponAdapter.resolveWeaponConflict(params, editKeyHeaders(params.partyShortcode)),
		...invalidatePartyOnSuccess(queryClient)
	}
}

export function swapWeaponsOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: SwapPositionsParams & { partyShortcode: string }) =>
			gridWeaponAdapter.swapWeapons(params, editKeyHeaders(params.partyShortcode)),
		...invalidatePartyOnSuccess(queryClient)
	}
}

export function duplicateGridWeaponOptions(queryClient: QueryClient) {
	return {
		mutationFn: (params: { id: string; partyShortcode: string; position: number }) =>
			gridWeaponAdapter.duplicateWeapon(
				{ id: params.id, position: params.position },
				editKeyHeaders(params.partyShortcode)
			),
		...invalidatePartyOnSuccess(queryClient)
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
