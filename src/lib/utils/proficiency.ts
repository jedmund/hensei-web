export const PROFICIENCY_LABELS: Record<number, string> = {
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

export function getProficiencyLabel(proficiency: number): string {
	return PROFICIENCY_LABELS[proficiency] || '—'
}

export function getProficiencyIcon(proficiency: number): string {
	const label = PROFICIENCY_LABELS[proficiency]
	if (!label || label === 'None') return ''
	// Capitalize first letter for filename
	const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1)
	return `/images/labels/proficiency/Label_Weapon_${capitalizedLabel}.png`
}

export function getProficiencyOptions() {
	return Object.entries(PROFICIENCY_LABELS).map(([value, label]) => ({
		value: Number(value),
		label
	}))
}