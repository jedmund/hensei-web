/**
 * Which key slots a weapon copy has opened. A slot belongs to a weapon skill that
 * only appears at some uncap. The rules are series data editors keep in the
 * Database (hensei-api's WeaponKeySlots enforces them): the weapon's key slot count
 * (a variant can lower it) and, per slot, the uncap a copy needs.
 */
import type { WeaponSeriesRef } from '$lib/types/api/weaponSeries'

type KeySlotRules = Pick<WeaponSeriesRef, 'numWeaponKeys' | 'keySlotMinUncaps'>

/** The key slots an editor should offer for a copy at this uncap level */
export function openKeySlots(series: KeySlotRules | undefined, uncapLevel: number): number[] {
	const count = series?.numWeaponKeys ?? 0
	const minUncaps = series?.keySlotMinUncaps ?? []
	return Array.from({ length: count }, (_, slot) => slot).filter(
		(slot) => uncapLevel >= (minUncaps[slot] ?? 0)
	)
}
