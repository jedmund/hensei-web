/**
 * Shared helpers for the grid mutation modules.
 *
 * @module api/mutations/gridShared
 */

import type { QueryClient } from '@tanstack/svelte-query'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party } from '$lib/types/api/party'
import { getEditKey } from '$lib/utils/editKeys'

export function editKeyHeaders(partyShortcode: string): Record<string, string> | undefined {
	const editKey = getEditKey(partyShortcode)
	return editKey ? { 'X-Edit-Key': editKey } : undefined
}

// ============================================================================
// Shared optimistic update helpers
// ============================================================================

export function optimisticRollback(
	queryClient: QueryClient,
	partyShortcode: string,
	context: { previousParty?: Party } | undefined
) {
	if (context?.previousParty) {
		queryClient.setQueryData(partyKeys.detail(partyShortcode), context.previousParty)
	}
}

export function invalidateOnSettled(queryClient: QueryClient, partyShortcode: string) {
	queryClient.invalidateQueries({ queryKey: partyKeys.detail(partyShortcode) })
}

// ============================================================================
// Option builders
// ============================================================================

type GridListKey = 'weapons' | 'characters' | 'summons'

/** Rollback context returned by every optimistic grid mutation. */
export type GridMutationContext = { previousParty?: Party }

/**
 * Builds the `onMutate` / `onError` / `onSettled` trio shared by every grid
 * mutation that edits one of the party's item lists optimistically.
 *
 * `onMutate` cancels in-flight party fetches, snapshots the party and, only
 * when the list is present, writes `apply(list, vars)` back to the cache.
 * `onError` restores the snapshot; `onSettled` refetches the party.
 */
export function optimisticGridList<K extends GridListKey, TVars extends { partyShortcode: string }>(
	queryClient: QueryClient,
	key: K,
	apply: (items: Party[K], vars: TVars) => Party[K]
) {
	return {
		onMutate: async (vars: TVars) => {
			const queryKey = partyKeys.detail(vars.partyShortcode)
			await queryClient.cancelQueries({ queryKey })

			const previousParty = queryClient.getQueryData<Party>(queryKey)

			if (previousParty?.[key]) {
				queryClient.setQueryData(queryKey, {
					...previousParty,
					[key]: apply(previousParty[key], vars)
				})
			}

			return { previousParty }
		},
		onError: (
			_err: unknown,
			{ partyShortcode }: { partyShortcode: string },
			context: GridMutationContext | undefined
		) => {
			optimisticRollback(queryClient, partyShortcode, context)
		},
		onSettled: (_data: unknown, _err: unknown, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
		}
	}
}

/**
 * Builds the `onSuccess` used by grid mutations that don't touch the cache
 * optimistically: refetch the party, then any extra queries (such as the
 * user's collection after a sync-to-collection).
 */
export function invalidatePartyOnSuccess(
	queryClient: QueryClient,
	extraKeys: readonly (readonly unknown[])[] = []
) {
	return {
		onSuccess: (_data: unknown, { partyShortcode }: { partyShortcode: string }) => {
			invalidateOnSettled(queryClient, partyShortcode)
			for (const queryKey of extraKeys) {
				queryClient.invalidateQueries({ queryKey })
			}
		}
	}
}

// ============================================================================
// List transforms
// ============================================================================

type GridItem = { id: string; position: number }

/** Identifies one grid slot, by item id or by position. */
export type GridSlotVars = { partyShortcode: string; id?: string; position?: number }

/** Variables for the delete mutations. Only the API call needs `partyId`. */
export type DeleteGridItemVars = GridSlotVars & { partyId: string }

/** Removes the item with `id`, or the item at `position` when no id is given. */
export function removeGridItem<T extends GridItem>(
	items: T[],
	{ id, position }: { id?: string; position?: number }
): T[] {
	return items.filter((item) => (id ? item.id !== id : item.position !== position))
}

/** Sets the uncap level, and the transcendence step when given, on one item. */
export function applyGridUncap<T extends GridItem>(
	items: T[],
	{
		id,
		uncapLevel,
		transcendenceStep
	}: { id?: string | undefined; uncapLevel: number; transcendenceStep?: number | undefined }
): T[] {
	return items.map((item) =>
		item.id === id
			? {
					...item,
					uncapLevel,
					...(transcendenceStep !== undefined && { transcendenceStep })
				}
			: item
	)
}

const NOTES_SYNC_KEYS = new Set(['description', 'notesSynced', 'substitutions'])

/**
 * Merges `updates` into the item with `id`. When the edit touches a synced
 * item's notes or flips its sync flag, the notes keys are mirrored onto every
 * sibling with the same canonical granblue id, so the UI matches what the
 * backend will produce.
 */
export function applyNotesSyncedUpdate<T extends GridItem & { notesSynced?: boolean }>(
	items: T[],
	id: string,
	updates: Partial<T>,
	granblueIdOf: (item: T) => string | undefined
): T[] {
	const target = items.find((item) => item.id === id)
	const targetGranblueId = target ? granblueIdOf(target) : undefined
	const groupPayload = Object.fromEntries(
		Object.entries(updates).filter(([k]) => NOTES_SYNC_KEYS.has(k))
	) as Partial<T>
	const flagInPayload = 'notesSynced' in updates
	const willBeSynced = flagInPayload ? updates.notesSynced === true : !!target?.notesSynced
	const shouldFanOut =
		!!targetGranblueId && willBeSynced && (flagInPayload || Object.keys(groupPayload).length > 0)

	return items.map((item) => {
		if (item.id === id) return { ...item, ...updates }
		if (shouldFanOut && String(granblueIdOf(item)) === String(targetGranblueId)) {
			return { ...item, ...groupPayload }
		}
		return item
	})
}
