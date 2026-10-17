/**
 * Pure helpers for giving stickers and showing labels.
 *
 * Kept free of Svelte and TanStack so the picker rules can be unit tested.
 */

import { PartyVisibility } from '$lib/types/visibility'
import type { Party } from '$lib/types/api/party'
import type { Sticker } from '$lib/types/api/sticker'

/**
 * What picking a sticker does, given the user's current one:
 * - nothing given yet → give it
 * - the same one → remove it
 * - a different one → swap to it
 */
export type StickerAction =
	| { type: 'give'; slug: string }
	| { type: 'remove'; slug: string }
	| { type: 'swap'; from: string; slug: string }

export function nextStickerAction(
	current: string | null | undefined,
	picked: string
): StickerAction {
	if (!current) return { type: 'give', slug: picked }
	if (current === picked) return { type: 'remove', slug: picked }
	return { type: 'swap', from: current, slug: picked }
}

/** The user's sticker after the action has been applied */
export function stickerAfter(action: StickerAction): string | null {
	return action.type === 'remove' ? null : action.slug
}

type StickerTarget = Pick<Party, 'id' | 'user' | 'visibility'>

/**
 * Whether the picker should be offered for a party.
 *
 * Hidden on unsaved parties, non-public parties (the API rejects them) and the
 * viewer's own party. Parties without an owner account can receive stickers.
 * Signed-out viewers still see the picker; it prompts them to sign in.
 */
export function canShowStickerPicker(party: StickerTarget, viewerId?: string | null): boolean {
	if (!party.id || party.id === 'new') return false
	if (party.visibility !== undefined && party.visibility !== PartyVisibility.PUBLIC) return false
	if (viewerId && party.user?.id === viewerId) return false
	return true
}

/** Looks up a slug in the catalogue */
export function findSticker(
	catalogue: Sticker[] | undefined,
	slug: string | null | undefined
): Sticker | undefined {
	if (!slug || !catalogue) return undefined
	return catalogue.find((s) => s.slug === slug)
}

/** Active stickers in picker order */
export function pickerStickers(catalogue: Sticker[] | undefined): Sticker[] {
	return (catalogue ?? []).filter((s) => s.active).toSorted((a, b) => a.position - b.position)
}

/** Applies `mySticker` to a party if it matches, returning a new object */
export function withMySticker<T extends Pick<Party, 'id'> & { mySticker?: string | null }>(
	party: T,
	partyId: string,
	mySticker: string | null
): T {
	if (party.id !== partyId) return party
	return { ...party, mySticker }
}
