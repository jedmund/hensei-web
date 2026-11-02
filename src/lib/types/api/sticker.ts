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
	/** The stamp with its Japanese caption; null shows imageUrl */
	imageUrlJa: string | null
	position: number
	active: boolean
	/** Editors only: nobody has given it yet, so it can be deleted */
	deletable?: boolean
	/** Editors only: how many teams carry it */
	givenCount?: number
}

/** Which of a sticker's images: the English one, or the Japanese one */
export type StickerImageLanguage = 'en' | 'ja'

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
	/** Use this library sticker's images */
	libraryId?: number
}

/** One of the game's own stickers, which editors can make a sticker from */
export interface LibrarySticker {
	/** The game's sticker number */
	id: number
	/** The wiki's caption: who's on it and what it says */
	label: string
	/** Standard, Event, Rupie or Promotional Stickers */
	section: string
	/** The event or promotion it came from, within its section */
	group: string | null
	imageUrl: string
	imageUrlJa: string | null
	/** The catalogue sticker already made from it */
	stickerId: string | null
}
