/**
 * What the draw animation needs from a result, and the viewer's choice to
 * play it. While the switch is on, Draw is locked to one purchase (a 10-draw
 * or a single draw) and plays the animation before the results.
 */

import { choosePresentation, type Presentation } from '$lib/gacha-animation/presentation'
import { drawMoons, type Moon } from '$lib/gacha-animation/moons'
import type { GachaShare } from '$lib/utils/gachaShare'
import type { CatalogueItem } from '$lib/types/gacha'
import { onePurchase } from './pools'

export const ANIMATION_KEY = 'gacha:playAnimation'

export interface DrawAnimation {
	items: CatalogueItem[]
	presentation: Presentation
	moons: Moon[]
	newCharacters: ReadonlySet<string>
}

/** Identities of drawn summons the viewer doesn't have; none while their summons are unknown */
export function newSummonIdentities(
	drawn: CatalogueItem[],
	ownedSummons: ReadonlySet<string> | undefined
): Set<string> {
	if (!ownedSummons) return new Set()
	return new Set(
		drawn
			.filter((item) => item.drawable_type === 'Summon' && !ownedSummons.has(item.drawable_id))
			.map((item) => item.identity)
	)
}

/** The animation for a draw's items in order; null when there's nothing to show */
export function drawAnimation(
	drawn: CatalogueItem[],
	seed: string,
	owned: ReadonlySet<string> | undefined,
	ownedSummons: ReadonlySet<string> | undefined
): DrawAnimation | null {
	if (drawn.length === 0) return null
	const { moons, newCharacters } = drawMoons(drawn, owned)
	const newSummons = newSummonIdentities(drawn, ownedSummons)
	return {
		items: drawn,
		presentation: choosePresentation(drawn, seed, { newCharacters, newSummons }),
		moons,
		newCharacters
	}
}

/**
 * Whether the remembered switch applies to a visit: a shared link with
 * settings other than one purchase keeps its settings, so the switch stays
 * off for that visit.
 */
export function keepsLinkSettings(search: string, share: GachaShare): boolean {
	return !search || String(share.draws) === onePurchase(share.purchase)
}

/** The viewer's remembered choice; off when storage is unavailable */
export function readAnimationPreference(): boolean {
	try {
		return localStorage.getItem(ANIMATION_KEY) === '1'
	} catch {
		return false
	}
}

export function writeAnimationPreference(value: boolean): void {
	try {
		localStorage.setItem(ANIMATION_KEY, value ? '1' : '0')
	} catch {
		// Storage can be unavailable (private mode); the switch still works
	}
}
