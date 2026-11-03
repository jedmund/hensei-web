/**
 * Which key slots a weapon copy has opened. A slot belongs to a weapon skill that
 * only appears at some uncap. The rules are series data editors keep in the
 * Database (hensei-api's WeaponKeySlots enforces them): the weapon's key slot count
 * (a variant can lower it) and, per slot, the uncap a copy needs.
 */
import type { WeaponSeriesRef } from '$lib/types/api/weaponSeries'

type KeySlotRules = Pick<WeaponSeriesRef, 'numWeaponKeys' | 'keySlotMinUncaps'>

/** Every key slot the weapon has, open or not */
export function keySlots(series: KeySlotRules | undefined): number[] {
	return Array.from({ length: series?.numWeaponKeys ?? 0 }, (_, slot) => slot)
}

/** The key slots a copy at this uncap level can fill */
export function openKeySlots(series: KeySlotRules | undefined, uncapLevel: number): number[] {
	const minUncaps = series?.keySlotMinUncaps ?? []
	return keySlots(series).filter((slot) => uncapLevel >= (minUncaps[slot] ?? 0))
}
