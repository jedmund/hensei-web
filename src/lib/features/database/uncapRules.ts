/**
 * Uncap rules weapons and summons share: FLB, ULB and transcendence stack,
 * and the standard max level follows the rarity and the uncaps. The API's
 * caps_mismatch flags use the same table.
 */
import type { Values } from '$lib/features/database/schema/types'

export const STACKED_UNCAPS = ['flb', 'ulb', 'transcendence']

const flb = (v: Values) => v.flb === true
const ulb = (v: Values) => v.ulb === true
const transcendence = (v: Values) => v.transcendence === true

/**
 * The standard max level for a rarity and uncap state: R 50; SR 75, FLB 150;
 * SSR 100, FLB 150, ULB 200, transcendence 250
 */
export function standardMaxLevel(v: Values): number {
	if (v.rarity === 1) return 50
	if (v.rarity !== 2 && transcendence(v)) return 250
	if (v.rarity !== 2 && ulb(v)) return 200
	if (flb(v)) return 150
	return v.rarity === 2 ? 75 : 100
}

/** Each uncap needs the one before it, so ticking or unticking one carries the rest */
export function stackedUncapCascade(v: Values, changed: string | null): Values | undefined {
	if (changed === 'flb' && !flb(v)) return { ulb: false, transcendence: false }
	if (changed === 'ulb') return ulb(v) ? { flb: true } : { transcendence: false }
	if (changed === 'transcendence' && transcendence(v)) return { flb: true, ulb: true }
	return undefined
}
