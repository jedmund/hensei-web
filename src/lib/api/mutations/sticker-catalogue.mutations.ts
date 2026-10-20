/**
 * Sticker Catalogue Mutation Configurations
 *
 * The editor operations on the sticker catalogue (Database > Stickers). Each
 * refreshes the catalogue when it succeeds.
 *
 * Each mutation exports an options factory (for tests) and a hook.
 *
 * @module api/mutations/sticker-catalogue
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { stickerAdapter } from '$lib/api/adapters/sticker.adapter'
import { stickerKeys } from '$lib/api/queries/sticker.queries'
import type { StickerImageLanguage, StickerPayload } from '$lib/types/api/sticker'

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
		mutationFn: ({
			id,
			file,
			language = 'en'
		}: {
			id: string
			file: File
			language?: StickerImageLanguage
		}) => stickerAdapter.uploadImage(id, file, file.name, language),
		onSuccess: () => invalidateCatalogue(queryClient)
	}
}

export function useUploadStickerImage() {
	const queryClient = useQueryClient()
	return createMutation(() => uploadStickerImageOptions(queryClient))
}

type UploadStickerImage = {
	mutateAsync: (variables: {
		id: string
		file: File
		language: StickerImageLanguage
	}) => Promise<unknown>
}

/** Uploads whichever of a sticker's images were chosen, English first */
export async function uploadImages(
	upload: UploadStickerImage,
	id: string,
	files: Partial<Record<StickerImageLanguage, File>>
) {
	for (const language of ['en', 'ja'] as const) {
		const file = files[language]
		if (file) await upload.mutateAsync({ id, file, language })
	}
}
