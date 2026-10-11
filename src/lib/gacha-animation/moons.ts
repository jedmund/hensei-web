/**
 * Moons and new characters. In the game, drawing a character you already
 * have gives a moon in place of the character: bronze for R, silver for SR,
 * gold for SSR. A character you don't have yet joins your party instead.
 *
 * "Already have" means in the viewer's collection (signed in) or drawn
 * earlier in the same run.
 */

import type { CatalogueItem } from '$lib/types/gacha'

/** The game's moon codes: none, bronze, silver, gold */
export type Moon = 0 | 1 | 2 | 3

const MOON: Record<number, Moon> = { 1: 1, 2: 2, 3: 3 }

const characterOf = (item: CatalogueItem) => item.recruits?.granblue_id

export interface DrawMoons {
	/** A moon per item, in draw order */
	moons: Moon[]
	/** Identities of items whose character is new to the viewer */
	newCharacters: Set<string>
}

/**
 * @param owned - granblue ids of the viewer's characters; without it (signed
 *   out) only repeats within the draw give moons, and no character counts as
 *   new, since we can't know
 */
export function drawMoons(items: CatalogueItem[], owned?: ReadonlySet<string>): DrawMoons {
	const seen = new Set(owned)
	const newCharacters = new Set<string>()
	const moons = items.map((item) => {
		const character = characterOf(item)
		if (!character) return 0
		if (seen.has(character)) return MOON[item.rarity] ?? 0
		seen.add(character)
		if (owned) newCharacters.add(item.identity)
		return 0
	})
	return { moons, newCharacters }
}

/**
 * Gold moons in a whole result: every copy of an owned SSR character, and
 * every copy after the first of the others
 */
export function goldMoonCount(items: CatalogueItem[], owned?: ReadonlySet<string>): number {
	const copies = new Map<string, number>()
	for (const item of items) {
		const character = characterOf(item)
		if (item.rarity !== 3 || !character) continue
		copies.set(character, (copies.get(character) ?? 0) + Number(item.count ?? 1))
	}
	let total = 0
	for (const [character, count] of copies) {
		total += owned?.has(character) ? count : count - 1
	}
	return total
}
