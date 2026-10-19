// Sticker types, as the API returns them.
// Stickers are an editor-managed catalogue; members give one per team.

import type { LocalizedName } from './entities'

/** A sticker from StickerBlueprint */
export interface Sticker {
	id: string
	slug: string
	/** What the sticker says about a team, shown as its tooltip */
	meaning: LocalizedName
	imageUrl: string | null
	position: number
	active: boolean
}

/** One row of the owner's private breakdown */
export interface StickerBreakdownEntry {
	/** Sticker slug */
	sticker: string
	count: number
}

/** Editor create/update payload */
export interface StickerPayload {
	slug: string
	meaningEn: string
	meaningJp: string
	position?: number
	active?: boolean
}
