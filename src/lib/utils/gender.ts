/**
 * Gender mapping utilities for Granblue Fantasy
 */

import { getBasePath } from '$lib/utils/images'
import * as m from '$lib/paraglide/messages'

export const GENDER_LABELS: Record<number, string> = {
	0: 'Unknown',
	1: 'Male',
	2: 'Female',
	3: 'Other'
}

export function getGenderLabel(gender?: number | null): string {
	if (gender === null || gender === undefined) return '—'
	const genderMessages: Record<number, () => string> = {
		0: m.gender_unknown,
		1: m.gender_male,
		2: m.gender_female,
		3: m.gender_other
	}
	const messageFn = genderMessages[gender]
	return messageFn ? messageFn() : '—'
}

export function getGenderIcon(gender?: number | null): string {
	if (gender === null || gender === undefined) return ''
	const label = GENDER_LABELS[gender]
	if (!label || label === 'Unknown') return ''
	// Gender icons may use different naming convention
	return `${getBasePath()}/labels/gender/Label_Gender_${label.replace('/', '_')}.png`
}

export function getGenderOptions() {
	const genderMessages: Record<number, () => string> = {
		0: m.gender_unknown,
		1: m.gender_male,
		2: m.gender_female,
		3: m.gender_other
	}
	return Object.entries(genderMessages).map(([value, messageFn]) => ({
		value: Number(value),
		label: messageFn()
	}))
}