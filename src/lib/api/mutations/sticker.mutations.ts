/**
 * Sticker Mutation Configurations
 *
 * Giving and removing the viewer's sticker on a team. Optimistic: every
 * cached copy of the team updates before the request returns. The editor
 * catalogue operations are in sticker-catalogue.mutations.
 *
 * Each mutation exports an options factory (for tests) and a hook.
 *
 * @module api/mutations/sticker
 */

import type { StickerPlacement } from '$lib/types/api/party'
import {
	useQueryClient,
	createMutation,
	hashKey,
	type QueryClient,
	type QueryKey
} from '@tanstack/svelte-query'
import { stickerAdapter } from '$lib/api/adapters/sticker.adapter'
import { partyKeys } from '$lib/api/queries/party.queries'
import { userKeys } from '$lib/api/queries/user.queries'
import type { Party } from '$lib/types/api/party'
import { withMySticker } from '$lib/utils/stickers'

// ============================================================================
// Optimistic cache helpers
// ============================================================================

/** Query trees that can hold a party with `mySticker` */
const partyCacheRoots: QueryKey[] = [partyKeys.all, userKeys.favorites()]

/**
 * Adds a query tree that can hold parties (a feed, say), so giving or taking
 * back a sticker updates the copies there too. Call it once, where the
 * queries are defined.
 */
export function registerStickerCacheRoot(queryKey: QueryKey) {
	if (partyCacheRoots.some((root) => hashKey(root) === hashKey(queryKey))) return
	partyCacheRoots.push(queryKey)
}

type Snapshot = Array<[QueryKey, unknown]>

function isParty(value: Record<string, unknown>, partyId: string): boolean {
	return value.id === partyId && typeof value.shortcode === 'string'
}

/**
 * Sets `mySticker` on every copy of a party inside cached data, whatever the
 * shape: list results, infinite pages, or parties nested deeper in a
 * payload. Returns the same reference when nothing changed. Labels are left
 * alone; they depend on a server-side threshold.
 */
export function patchPartyCollection(data: unknown, partyId: string, slug: string | null): unknown {
	if (!data || typeof data !== 'object') return data

	if (Array.isArray(data)) {
		let changed = false
		const next = data.map((item) => {
			const patched = patchPartyCollection(item, partyId, slug)
			if (patched !== item) changed = true
			return patched
		})
		return changed ? next : data
	}

	const obj = data as Record<string, unknown>
	if (isParty(obj, partyId)) return withMySticker(obj as unknown as Party, partyId, slug)

	let changed = false
	const next: Record<string, unknown> = {}
	for (const [key, value] of Object.entries(obj)) {
		const patched = patchPartyCollection(value, partyId, slug)
		if (patched !== value) changed = true
		next[key] = patched
	}
	return changed ? next : data
}

async function applyOptimisticSticker(
	queryClient: QueryClient,
	params: StickerParams,
	slug: string | null
): Promise<{ snapshot: Snapshot }> {
	const detailKey = partyKeys.detail(params.shortcode)
	// Only the detail query is cancelled; cancelling list roots could abort an
	// in-flight "load more" that nothing re-triggers.
	await queryClient.cancelQueries({ queryKey: detailKey })

	const snapshot: Snapshot = [
		...queryClient.getQueriesData({ queryKey: detailKey }),
		...partyCacheRoots.flatMap((queryKey) => queryClient.getQueriesData({ queryKey }))
	]

	queryClient.setQueryData<Party>(detailKey, (old) =>
		old ? withMySticker(old, params.id, slug) : old
	)
	for (const queryKey of partyCacheRoots) {
		queryClient.setQueriesData({ queryKey }, (old: unknown) =>
			patchPartyCollection(old, params.id, slug)
		)
	}

	return { snapshot }
}

function rollback(queryClient: QueryClient, context: { snapshot: Snapshot } | undefined) {
	for (const [key, data] of context?.snapshot ?? []) {
		queryClient.setQueryData(key, data)
	}
}

// ============================================================================
// Give / remove
// ============================================================================

export interface StickerParams {
	/** Party UUID (the endpoint) */
	id: string
	/** Party shortcode (the detail cache key) */
	shortcode: string
}

export interface GiveStickerParams extends StickerParams {
	slug: string
	/** Where it sits in the sticker area; also moves it */
	placement?: StickerPlacement
}

export function giveStickerOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, slug, placement }: GiveStickerParams) =>
			stickerAdapter.giveSticker(id, slug, placement),
		onMutate: (params: GiveStickerParams) =>
			applyOptimisticSticker(queryClient, params, params.slug),
		onError: (_err: unknown, _params: GiveStickerParams, context?: { snapshot: Snapshot }) =>
			rollback(queryClient, context),
		onSettled: (_data: unknown, _err: unknown, { shortcode }: GiveStickerParams) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
		}
	}
}

export function useGiveSticker() {
	const queryClient = useQueryClient()
	return createMutation(() => giveStickerOptions(queryClient))
}

export function removeStickerOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id }: StickerParams) => stickerAdapter.removeSticker(id),
		onMutate: (params: StickerParams) => applyOptimisticSticker(queryClient, params, null),
		onError: (_err: unknown, _params: StickerParams, context?: { snapshot: Snapshot }) =>
			rollback(queryClient, context),
		onSettled: (_data: unknown, _err: unknown, { shortcode }: StickerParams) => {
			queryClient.invalidateQueries({ queryKey: partyKeys.detail(shortcode) })
		}
	}
}

export function useRemoveSticker() {
	const queryClient = useQueryClient()
	return createMutation(() => removeStickerOptions(queryClient))
}
