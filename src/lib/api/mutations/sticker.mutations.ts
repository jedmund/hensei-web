/**
 * Sticker Mutation Configurations
 *
 * Giving and removing a sticker (optimistic: the picker and the highlighted
 * sticker update before the request returns), plus the editor catalogue
 * operations.
 *
 * Each mutation exports an options factory (for tests) and a hook.
 *
 * @module api/mutations/sticker
 */

import type { StickerPlacement } from '$lib/types/api/party'
import {
	useQueryClient,
	createMutation,
	type QueryClient,
	type QueryKey
} from '@tanstack/svelte-query'
import { stickerAdapter } from '$lib/api/adapters/sticker.adapter'
import { stickerKeys } from '$lib/api/queries/sticker.queries'
import { partyKeys } from '$lib/api/queries/party.queries'
import { userKeys } from '$lib/api/queries/user.queries'
import type { Party } from '$lib/types/api/party'
import type { StickerPayload } from '$lib/types/api/sticker'
import { withMySticker } from '$lib/utils/stickers'

// ============================================================================
// Optimistic cache helpers
// ============================================================================

/** Query trees that can hold a party with `mySticker` */
const PARTY_CACHE_ROOTS: QueryKey[] = [partyKeys.all, userKeys.favorites()]

type Snapshot = Array<[QueryKey, unknown]>

function isParty(value: Record<string, unknown>, partyId: string): boolean {
	return value.id === partyId && typeof value.shortcode === 'string'
}

/**
 * Sets `mySticker` on every copy of a party inside cached data, whatever the
 * shape: list results, infinite pages, or parties nested deeper in a
 * payload. Returns the same reference when
 * nothing changed. Labels are left alone; they depend on a server-side
 * threshold.
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
		...PARTY_CACHE_ROOTS.flatMap((queryKey) => queryClient.getQueriesData({ queryKey }))
	]

	queryClient.setQueryData<Party>(detailKey, (old) =>
		old ? withMySticker(old, params.id, slug) : old
	)
	for (const queryKey of PARTY_CACHE_ROOTS) {
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

// ============================================================================
// Editor catalogue
// ============================================================================

function invalidateCatalogue(queryClient: QueryClient) {
	queryClient.invalidateQueries({ queryKey: stickerKeys.all })
}

export function createStickerOptions(queryClient: QueryClient) {
	return {
		mutationFn: (payload: StickerPayload) => stickerAdapter.createSticker(payload),
		onSuccess: () => invalidateCatalogue(queryClient)
	}
}

export function useCreateSticker() {
	const queryClient = useQueryClient()
	return createMutation(() => createStickerOptions(queryClient))
}

export function updateStickerOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, payload }: { id: string; payload: Partial<StickerPayload> }) =>
			stickerAdapter.updateSticker(id, payload),
		onSuccess: () => invalidateCatalogue(queryClient)
	}
}

export function useUpdateSticker() {
	const queryClient = useQueryClient()
	return createMutation(() => updateStickerOptions(queryClient))
}

export function deleteStickerOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id }: { id: string }) => stickerAdapter.deleteSticker(id),
		onSuccess: () => invalidateCatalogue(queryClient)
	}
}

export function useDeleteSticker() {
	const queryClient = useQueryClient()
	return createMutation(() => deleteStickerOptions(queryClient))
}

export function reorderStickersOptions(queryClient: QueryClient) {
	return {
		mutationFn: (ids: string[]) => stickerAdapter.reorderStickers(ids),
		onSuccess: () => invalidateCatalogue(queryClient)
	}
}

export function useReorderStickers() {
	const queryClient = useQueryClient()
	return createMutation(() => reorderStickersOptions(queryClient))
}

export function uploadStickerImageOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, file }: { id: string; file: File }) =>
			stickerAdapter.uploadImage(id, file, file.name),
		onSuccess: () => invalidateCatalogue(queryClient)
	}
}

export function useUploadStickerImage() {
	const queryClient = useQueryClient()
	return createMutation(() => uploadStickerImageOptions(queryClient))
}
