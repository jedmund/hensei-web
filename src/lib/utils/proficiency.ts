import { getBasePath } from '$lib/utils/images'
import * as m from '$lib/paraglide/messages'

// English keys used for file paths only — not for display
const PROFICIENCY_KEYS: Record<number, string> = {
	0: 'None',
	1: 'Sabre',
	2: 'Dagger',
	3: 'Axe',
	4: 'Spear',
	5: 'Bow',
	6: 'Staff',
	7: 'Melee',
	8: 'Harp',
	9: 'Gun',
	10: 'Katana'
}

const PROFICIENCY_MESSAGES: Record<number, () => string> = {
	0: m.proficiency_none,
	1: m.proficiency_sabre,
	2: m.proficiency_dagger,
	3: m.proficiency_axe,
	4: m.proficiency_spear,
	5: m.proficiency_bow,
	6: m.proficiency_staff,
	7: m.proficiency_melee,
	8: m.proficiency_harp,
	9: m.proficiency_gun,
	10: m.proficiency_katana
}

/** @deprecated Use getProficiencyLabel() instead for display text */
export const PROFICIENCY_LABELS = PROFICIENCY_KEYS

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

export function getProficiencyImage(proficiency: number): string {
	const key = PROFICIENCY_KEYS[proficiency]
	if (!key || key === 'None') return ''
	return `${getBasePath()}/proficiencies/${key.toLowerCase()}.png`
}
