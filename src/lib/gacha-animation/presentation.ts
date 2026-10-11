/**
 * How a draw is presented in the animation: which crystal opens it, which
 * opening pattern plays, which stones fake out by starting at a lower rarity,
 * and whether the transition bursts. In the game the server picks these per
 * draw (`rendering_id`); here they follow from the result, with the random
 * choices seeded by the result's seed so the same result plays the same show.
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

/**
 * The game's opening pattern (`main_pattern`, `sub_pattern`, `add_pattern`).
 * Main 1–5 open on a rainbow crystal, 6 gold, 7 blue-violet and 8 blue.
 */
export interface Pattern {
	main: number
	sub: number
	add: number
}

export interface Presentation {
	crystal: Crystal
	pattern: Pattern
	/** A blue crystal can't happen in a 10-draw (one SR is guaranteed), so it's a fake-out */
	fakeOut: boolean
	/** Gold's prismatic burst between the opening and the stones */
	burst: boolean
	stones: Stone[]
	/** Indices of items that play the "joined your party" scene */
	newCharacters: number[]
}

/** Chance that a single-SSR draw opens on the blue fake-out instead of gold */
export const FAKE_OUT_CHANCE = 0.1
/** Chance that each SR or SSR stone starts one rarity lower */
export const CLASS_UP_CHANCE = 0.15
/** Chance that a gold opening plays the prismatic burst transition */
export const BURST_CHANCE = 0.1

/**
 * Chance that a multi-SSR draw without a new character plays add 3, the
 * variant that hints at a new item without promising one. The game's rate
 * isn't known.
 */
export const NEW_ITEM_HINT_CHANCE = 0.25

/**
 * Rainbow 2 is the multi-SSR opening. Its add variants (from the game, as
 * observed in play):
 * - add 0: several SSRs, with or without a new character
 * - add 1: several SSRs and at least one new character (blue-sky shrine)
 * - add 3: several SSRs, maybe a new weapon or summon
 * - add 4: several SSRs and a new character
 * Rainbow 1 and 3–5 aren't mapped yet.
 */
const MULTI_SSR = { main: 2, sub: 0, add: 0 }
const MULTI_SSR_NEW_CHARACTER: Pattern[] = [0, 1, 4].map((add) => ({ ...MULTI_SSR, add }))

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

	// Rainbow for several SSRs, gold for a single SSR (sometimes faking out
	// with blue), blue-violet otherwise
	let crystal: Crystal = 'violet'
	let fakeOut = false
	if (ssrCount >= 2) {
		crystal = 'rainbow'
	} else if (ssrCount === 1) {
		fakeOut = random() < FAKE_OUT_CHANCE
		crystal = fakeOut ? 'blue' : 'gold'
	}

	const stones = rarities.map((rarity) => ({
		rarity,
		startsAs: rarity !== 'R' && random() < CLASS_UP_CHANCE ? LOWER[rarity] : rarity
	}))

	const burst = crystal === 'gold' && random() < BURST_CHANCE
	return {
		crystal,
		pattern: patternFor(crystal, burst, newIndices.length > 0, random),
		fakeOut,
		burst,
		stones,
		newCharacters: newIndices
	}
}

function patternFor(
	crystal: Crystal,
	burst: boolean,
	newCharacter: boolean,
	random: () => number
): Pattern {
	switch (crystal) {
		case 'rainbow':
			if (newCharacter) {
				const index = Math.floor(random() * MULTI_SSR_NEW_CHARACTER.length)
				return MULTI_SSR_NEW_CHARACTER[index] as Pattern
			}
			return random() < NEW_ITEM_HINT_CHANCE ? { ...MULTI_SSR, add: 3 } : MULTI_SSR
		case 'gold':
			// Sub-pattern 1 is gold's prismatic burst transition
			return { main: 6, sub: burst ? 1 : 0, add: 0 }
		case 'violet':
			return { main: 7, sub: 0, add: 0 }
		case 'blue':
			return { main: 8, sub: random() < 0.5 ? 1 : 0, add: 0 }
	}
}
