/**
 * How a draw is presented in the animation: which crystal opens it, which
 * stones fake out by starting at a lower rarity, and whether the transition
 * bursts. In the game the server picks these per draw; here they follow from
 * the result, with the random choices seeded by the result's seed so a
 * shared link replays the same show.
 */

import type { CatalogueItem } from '$lib/types/gacha'

export type Rarity = 'R' | 'SR' | 'SSR'
/** The opening crystal's colour, the game's main "tell" */
export type Crystal = 'rainbow' | 'gold' | 'violet' | 'blue'

export interface Stone {
	rarity: Rarity
	/** Rarity the stone shows first; differs from `rarity` when it classes up */
	startsAs: Rarity
}

export interface Presentation {
	crystal: Crystal
	/** A blue crystal can't happen in a 10-draw (one SR is guaranteed), so it's a fake-out */
	fakeOut: boolean
	/** The prismatic burst between the opening and the stones */
	burst: boolean
	stones: Stone[]
	/** Indices of items that play the "joined your party" scene */
	newCharacters: number[]
}

/** Chance that a single-SSR draw opens on the blue fake-out instead of gold */
export const FAKE_OUT_CHANCE = 0.1
/** Chance that each SR or SSR stone starts one rarity lower */
export const CLASS_UP_CHANCE = 0.15
/** Chance of the prismatic burst when the draw has an SSR */
export const BURST_CHANCE = 0.1

const RARITY: Record<number, Rarity> = { 1: 'R', 2: 'SR', 3: 'SSR' }
const LOWER: Record<Rarity, Rarity> = { R: 'R', SR: 'R', SSR: 'SR' }

/** Small, fast PRNG (mulberry32) seeded from a string hash (FNV-1a) */
export function seededRandom(seed: string): () => number {
	let hash = 0x811c9dc5
	for (let i = 0; i < seed.length; i++) {
		hash ^= seed.charCodeAt(i)
		hash = Math.imul(hash, 0x01000193)
	}
	let state = hash >>> 0
	return () => {
		state = (state + 0x6d2b79f5) >>> 0
		let t = state
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

export function choosePresentation(
	items: CatalogueItem[],
	seed: string,
	{ newCharacters = new Set<string>() }: { newCharacters?: Set<string> } = {}
): Presentation {
	const random = seededRandom(seed)
	const rarities = items.map((item) => RARITY[item.rarity] ?? 'R')
	const ssrCount = rarities.filter((rarity) => rarity === 'SSR').length
	const newIndices = items.flatMap((item, index) =>
		newCharacters.has(item.identity) ? [index] : []
	)

	// Rainbow for the big draws (several SSRs, or a new character), gold for
	// a single SSR (sometimes faking out with blue), blue-violet otherwise
	let crystal: Crystal = 'violet'
	let fakeOut = false
	if (ssrCount >= 2 || newIndices.length > 0) {
		crystal = 'rainbow'
	} else if (ssrCount === 1) {
		fakeOut = random() < FAKE_OUT_CHANCE
		crystal = fakeOut ? 'blue' : 'gold'
	}

	const stones = rarities.map((rarity) => ({
		rarity,
		startsAs: rarity !== 'R' && random() < CLASS_UP_CHANCE ? LOWER[rarity] : rarity
	}))

	return {
		crystal,
		fakeOut,
		burst: ssrCount > 0 && random() < BURST_CHANCE,
		stones,
		newCharacters: newIndices
	}
}
