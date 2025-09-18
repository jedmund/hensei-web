/**
 * Gender mapping utilities for Granblue Fantasy
 */

export const GENDER_LABELS: Record<number, string> = {
	0: 'Unknown',
	1: 'Male',
	2: 'Female',
	3: 'Other'
}

export function getGenderLabel(gender?: number | null): string {
	if (gender === null || gender === undefined) return '—'
	return GENDER_LABELS[gender] || '—'
}

export function getGenderIcon(gender?: number | null): string {
	const label = getGenderLabel(gender)
	if (label === '—' || label === 'Unknown') return ''
	// Gender icons may use different naming convention
	return `/images/labels/gender/Label_Gender_${label.replace('/', '_')}.png`
}

export function getGenderOptions() {
	return Object.entries(GENDER_LABELS).map(([value, label]) => ({
		value: Number(value),
		label
	}))
}