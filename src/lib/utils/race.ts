/**
 * Race mapping utilities for Granblue Fantasy
 */

import { getBasePath } from '$lib/utils/images'
import * as m from '$lib/paraglide/messages'

export const RACE_LABELS: Record<number, string> = {
	0: 'Unknown',
	1: 'Human',
	2: 'Erune',
	3: 'Draph',
	4: 'Harvin',
	5: 'Primal',
	6: 'Other'
}

export function getRaceLabel(race?: number | null): string {
	if (race === null || race === undefined) return '—'
	const raceMessages: Record<number, () => string> = {
		0: m.race_unknown,
		1: m.race_human,
		2: m.race_erune,
		3: m.race_draph,
		4: m.race_harvin,
		5: m.race_primal,
		6: m.race_other
	}
	const messageFn = raceMessages[race]
	return messageFn ? messageFn() : '—'
}

export function getRaceIcon(race?: number | null): string {
	if (race === null || race === undefined) return ''
	const label = RACE_LABELS[race]
	if (!label || label === 'Unknown') return ''
	return `${getBasePath()}/labels/race/Label_Race_${label}.png`
}

export function getRaceOptions() {
	// Add "None" option for empty selection
	const raceMessages: Record<number, () => string> = {
		0: m.race_unknown,
		1: m.race_human,
		2: m.race_erune,
		3: m.race_draph,
		4: m.race_harvin,
		5: m.race_primal,
		6: m.race_other
	}
	const options = [
		{ value: null as any, label: m.proficiency_none() },
		...Object.entries(raceMessages).map(([value, messageFn]) => ({
			value: Number(value),
			label: messageFn()
		}))
	]
	return options
}