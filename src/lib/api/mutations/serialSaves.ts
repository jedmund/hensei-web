/**
 * Whole-list saves, one at a time.
 *
 * The Solomonis guidebook, blessings and unseal priority writes each send a
 * party's complete list. Run in parallel, a late earlier response could
 * overwrite a newer list, and an earlier failure's rollback could erase a
 * later success. A TanStack mutation scope runs the saves for one party in
 * order; `hasQueuedSave` lets each save's callbacks leave the cache to the
 * save queued behind it.
 *
 * @module api/mutations/serialSaves
 */

import type { QueryClient } from '@tanstack/svelte-query'

export type SerialSaveKind = 'guidebook' | 'blessings' | 'unseal-priority'

/** The mutation key shared by every save of one kind. */
export function serialSaveKey(kind: SerialSaveKind) {
	return ['solomonis', kind] as const
}

/** Saves of one kind for one party share a scope, so they run in order. */
export function serialSaveScope(kind: SerialSaveKind, partyId: string | undefined) {
	return { id: `solomonis-${kind}-${partyId ?? 'none'}` }
}

/**
 * True when another save of this kind for this party is still pending: a save
 * queued behind the one whose callbacks are running (scoped saves run in
 * order, and the running one is still pending while its callbacks run).
 */
export function hasQueuedSave(
	queryClient: QueryClient,
	kind: SerialSaveKind,
	partyId: string
): boolean {
	const pending = queryClient.getMutationCache().findAll({
		mutationKey: serialSaveKey(kind),
		exact: true,
		status: 'pending',
		predicate: (mutation) =>
			(mutation.state.variables as { partyId?: string } | undefined)?.partyId === partyId
	})
	return pending.length > 1
}
