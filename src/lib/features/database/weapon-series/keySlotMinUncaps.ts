/**
 * A series' key slot unlocks: per key slot (index = slot), the uncap level a copy
 * needs before a key can go in it. hensei-api's WeaponKeySlots enforces them.
 */
import { z } from 'zod'
import type { Values } from '$lib/features/database/schema/types'

export const MAX_UNCAP = 6

/** How many slots the form's series has */
export function keySlotCount(values: Values): number {
	return values.has_weapon_keys === true ? Number(values.num_weapon_keys ?? 0) : 0
}

/** One level per slot: blanks are always open, slots past the count are dropped */
export function keySlotMinUncapsForSave(value: unknown, values: Values): number[] {
	const list = Array.isArray(value) ? (value as (number | null)[]) : []
	return Array.from({ length: keySlotCount(values) }, (_, slot) => list[slot] ?? 0)
}

/** "4★ / 5★": slot 1 opens at 4★, slot 2 at 5★ */
export function formatKeySlotMinUncaps(levels: readonly number[] | null | undefined): string {
	return (levels ?? []).map((level) => `${level}★`).join(' / ')
}

export const keySlotMinUncapsSchema = z.array(z.number().int().min(0).max(MAX_UNCAP).nullable())
