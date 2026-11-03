/**
 * Which key slots a weapon copy has opened. A slot belongs to a weapon skill that
 * only appears at some uncap. The rules are series data editors keep in the
 * Database (hensei-api's WeaponKeySlots enforces them): the weapon's key slot count
 * (a variant can lower it) and, per slot, the uncap a copy needs.
 */
import { getLocale } from '$lib/paraglide/runtime'
import type { WeaponSkillVersion } from '$lib/types/api/entities'
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

// What each series calls the key in each slot (0-based)
const KEY_TYPE_NAMES: Record<string, Record<number, { en: string; ja: string }>> = {
	// Dark Opus
	'dark-opus': {
		0: { en: 'Pendulum', ja: 'ペンデュラム' },
		1: { en: 'Pendulum/Chain', ja: 'ペンデュラム/チェイン' }
	},
	// Draconic
	draconic: {
		0: { en: 'Teluma', ja: 'テルマ' },
		1: { en: 'Teluma', ja: 'テルマ' }
	},
	// Draconic Providence
	'draconic-providence': {
		0: { en: 'Teluma', ja: 'テルマ' },
		1: { en: 'Teluma', ja: 'テルマ' }
	},
	// Ultima
	ultima: {
		0: { en: 'Gauph Key', ja: 'ガフスキー' },
		1: { en: 'Ultima Key', ja: 'ガフスキーΩ' },
		2: { en: 'Gate of Omnipotence', ja: 'ガフスキー' }
	},
	// Destroyer
	destroyer: {
		0: { en: 'Anklet', ja: 'アンクレット' }
	},
	// Superlative
	superlative: {
		0: { en: 'Teluma', ja: 'テルマ' },
		1: { en: 'Teluma', ja: 'テルマ' }
	}
}

/** The slot's key type ("Pendulum/Chain"), or "Key" for a series without names */
export function weaponKeyTypeName(seriesSlug: string | undefined, slot: number): string {
	const names = seriesSlug ? KEY_TYPE_NAMES[seriesSlug]?.[slot] : undefined
	return names?.[getLocale() === 'ja' ? 'ja' : 'en'] ?? 'Key'
}

/**
 * The weapon skill each key slot fills (index = key slot, value = skill position).
 * Most are the blank gate skills (Opus's Guiding Revelation, Destroyer's Cycle of
 * Strife); an Ultima's first key augments its own Rubell skill, so an Atma's lone
 * slot lands there too.
 */
const KEY_SLOT_SKILL_POSITIONS: Record<string, number[]> = {
	'dark-opus': [1, 2],
	draconic: [1, 2],
	'draconic-providence': [1, 2],
	destroyer: [2],
	ultima: [0, 1, 2]
}

/** The key slot that fills the skill at this position, if any */
export function keySlotForSkill(
	seriesSlug: string | undefined,
	position: number
): number | undefined {
	const slot = seriesSlug ? KEY_SLOT_SKILL_POSITIONS[seriesSlug]?.indexOf(position) : -1
	return slot === undefined || slot < 0 ? undefined : slot
}

/**
 * The version of a key's skill a copy has: the last its uncap and transcendence reach
 * (α Revelation Ruber from T1). Assumes the copy is at its uncap's level cap.
 */
export function activeKeySkill(
	versions: WeaponSkillVersion[] | undefined,
	uncapLevel: number,
	transcendenceStep: number
): WeaponSkillVersion | undefined {
	return [...(versions ?? [])]
		.sort((a, b) => a.ordinal - b.ordinal)
		.filter(
			(v) => uncapLevel >= (v.minUncap ?? 0) && transcendenceStep >= (v.transcendenceStage ?? 0)
		)
		.at(-1)
}
