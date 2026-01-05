import { getBasePath } from '$lib/utils/images'

export const PROFICIENCY_LABELS: Record<number, string> = {
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

export function getProficiencyLabel(proficiency: number): string {
	return PROFICIENCY_LABELS[proficiency] || '—'
}

export function getProficiencyIcon(proficiency: number): string {
	const label = PROFICIENCY_LABELS[proficiency]
	if (!label || label === 'None') return ''
	// Capitalize first letter for filename
	const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1)
	return `${getBasePath()}/labels/proficiency/Label_Weapon_${capitalizedLabel}.png`
}

export function getProficiencyOptions() {
	return Object.entries(PROFICIENCY_LABELS).map(([value, label]) => ({
		value: Number(value),
		label
	}))
}

export function getProficiencyImage(proficiency: number): string {
	const label = PROFICIENCY_LABELS[proficiency]
	if (!label || label === 'None') return ''
	return `/images/proficiencies/${label.toLowerCase()}.png`
}
