/**
 * Whether the viewer keeps sticker areas folded away: one setting for every
 * team. Kept in a cookie so the server renders the area the way it'll stay,
 * and set up once in the root layout so it carries across client-side
 * navigation (the layout's data isn't reloaded then).
 */
import { getContext, setContext } from 'svelte'

export const STICKERS_FOLDED_COOKIE = 'stickers_folded'

const KEY = Symbol('stickersFolded')

interface StickersFoldedBox {
	value: boolean
}

export function setStickersFolded(initial: boolean): void {
	const box = $state<StickersFoldedBox>({ value: initial })
	setContext(KEY, box)
}

export function getStickersFolded(): StickersFoldedBox {
	return getContext<StickersFoldedBox | undefined>(KEY) ?? { value: false }
}

/** Saves the setting for this and later visits */
export function saveStickersFolded(box: StickersFoldedBox, folded: boolean): void {
	box.value = folded
	document.cookie = folded
		? `${STICKERS_FOLDED_COOKIE}=1;path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
		: `${STICKERS_FOLDED_COOKIE}=;path=/;max-age=0;SameSite=Lax`
}
