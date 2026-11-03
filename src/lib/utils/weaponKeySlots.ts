/**
 * Which key slots a weapon copy has opened, per gbf.wiki. Mirrors hensei-api's
 * WeaponKeySlots concern (the API enforces it; this keeps the editor in step).
 * A slot belongs to a weapon skill that only appears at some uncap
 * (3★ = lvl 100, 4★ = 150, 5★ = 200).
 */

/** series slug → key slot → minimum uncap level */
const MIN_UNCAP: Record<string, Record<number, number>> = {
	// Pendulums in skill 2 at lvl 120; skill 3 (Pendulums/Chains) at 200
	'dark-opus': { 0: 4, 1: 5 },
	// Four Orbs' Judgment at lvl 150; Six Dragons' Radiance at 200
	draconic: { 0: 4, 1: 5 },
	// Forged from a lvl-200 Draconic
	'draconic-providence': { 0: 5, 1: 5 },
	// Anklets modify skill 3, at lvl 150
	destroyer: { 0: 4 },
	// Gate of Omnipotence at lvl 200
	ultima: { 2: 5 }
}

/** Ultima slots that Atma weapons (the lvl-100 stage, no ULB) don't have */
const ULTIMA_ONLY_SLOTS = [1, 2]

export function isKeySlotUnlocked(
	seriesSlug: string | undefined,
	slot: number,
	uncapLevel: number,
	ulb: boolean | undefined
): boolean {
	if (seriesSlug === 'ultima' && ULTIMA_ONLY_SLOTS.includes(slot) && ulb !== true) return false
	const min = seriesSlug ? (MIN_UNCAP[seriesSlug]?.[slot] ?? 0) : 0
	return uncapLevel >= min
}

/** The key slots an editor should offer: the series' slots this copy has opened */
export function openKeySlots(
	seriesSlug: string | undefined,
	slotCount: number,
	uncapLevel: number,
	ulb: boolean | undefined
): number[] {
	return [0, 1, 2].filter(
		(slot) => slot < slotCount && isKeySlotUnlocked(seriesSlug, slot, uncapLevel, ulb)
	)
}
