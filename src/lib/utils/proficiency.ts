import { getBasePath } from '$lib/utils/images/core'
import * as m from '$lib/paraglide/messages'

/** Proficiency ids, matching the game's own numbering */
export const ProficiencyId = {
	None: 0,
	Sabre: 1,
	Dagger: 2,
	Spear: 3,
	Axe: 4,
	Staff: 5,
	Gun: 6,
	Melee: 7,
	Bow: 8,
	Harp: 9,
	Katana: 10
} as const

// English keys used for file paths only — not for display
const PROFICIENCY_KEYS: Record<number, string> = {
	0: 'None',
	1: 'Sabre',
	2: 'Dagger',
	3: 'Spear',
	4: 'Axe',
	5: 'Staff',
	6: 'Gun',
	7: 'Melee',
	8: 'Bow',
	9: 'Harp',
	10: 'Katana'
}

const PROFICIENCY_MESSAGES: Record<number, () => string> = {
	0: m.proficiency_none,
	1: m.proficiency_sabre,
	2: m.proficiency_dagger,
	3: m.proficiency_spear,
	4: m.proficiency_axe,
	5: m.proficiency_staff,
	6: m.proficiency_gun,
	7: m.proficiency_melee,
	8: m.proficiency_bow,
	9: m.proficiency_harp,
	10: m.proficiency_katana
}

/** Weapon proficiencies (excludes None) in display order */
export const PROFICIENCY_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

/** @deprecated Use getProficiencyLabel() instead for display text */
export const PROFICIENCY_LABELS = PROFICIENCY_KEYS

/** Lowercase English key (e.g. 'sabre'), used in URLs and file paths */
export function getProficiencyKey(proficiency: number): string {
	return PROFICIENCY_KEYS[proficiency]?.toLowerCase() ?? ''
}

export function getProficiencyLabel(proficiency: number): string {
	const messageFn = PROFICIENCY_MESSAGES[proficiency]
	return messageFn ? messageFn() : '—'
}

export function getProficiencyIcon(proficiency: number): string {
	const key = PROFICIENCY_KEYS[proficiency]
	if (!key || key === 'None') return ''
	const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1)
	return `${getBasePath()}/labels/proficiency/Label_Weapon_${capitalizedKey}.png`
}

export function getProficiencyOptions() {
	return Object.entries(PROFICIENCY_MESSAGES).map(([value, messageFn]) => ({
		value: Number(value),
		label: messageFn()
	}))
}

/** Options for the weapon proficiencies (no None), in display order */
export function getWeaponProficiencyOptions() {
	return PROFICIENCY_DISPLAY_ORDER.map((value) => ({
		value: value as number,
		label: getProficiencyLabel(value)
	}))
}

export function getProficiencyImage(proficiency: number): string {
	const key = PROFICIENCY_KEYS[proficiency]
	if (!key || key === 'None') return ''
	return `${getBasePath()}/icons/proficiencies/${key.toLowerCase()}.png`
}
