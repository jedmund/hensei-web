/**
 * Sticker Query Options Factory
 *
 * @module api/queries/sticker
 */

import { queryOptions } from '@tanstack/svelte-query'
import { stickerAdapter } from '$lib/api/adapters/sticker.adapter'

export const stickerKeys = {
	all: ['stickers'] as const,
	active: () => [...stickerKeys.all, 'active'] as const,
	library: () => [...stickerKeys.all, 'library'] as const,
	detail: (idOrSlug: string) => [...stickerKeys.all, 'detail', idOrSlug] as const
}

export const stickerQueries = {
	/** Active stickers for the picker and labels. Mounted by every team card, so cache long. */
	active: () =>
		queryOptions({
			queryKey: stickerKeys.active(),
			queryFn: () => stickerAdapter.listStickers(),
			staleTime: 1000 * 60 * 30,
			gcTime: 1000 * 60 * 60
		}),

	/** The game's own stickers, for editors making stickers */
	library: () =>
		queryOptions({
			queryKey: stickerKeys.library(),
			queryFn: () => stickerAdapter.listLibrary(),
			staleTime: 1000 * 60
		})
}
