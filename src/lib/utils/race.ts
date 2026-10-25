/**
 * Race mapping utilities for Granblue Fantasy
 */

import { getBasePath } from '$lib/utils/images'
import * as m from '$lib/paraglide/messages'

export const RACE_LABELS: Record<number, string> = {
	1: 'Human',
	2: 'Erune',
	3: 'Draph',
	4: 'Harvin',
	5: 'Other',
	6: 'Primal',
	7: 'Geonoid',
	8: 'Levleath',
	9: 'Grokkle',
	10: 'Wolvir'
}

const RACE_MESSAGES: Record<number, () => string> = {
	1: m.race_human,
	2: m.race_erune,
	3: m.race_draph,
	4: m.race_harvin,
	5: m.race_other,
	6: m.race_primal,
	7: m.race_geonoid,
	8: m.race_levleath,
	9: m.race_grokkle,
	10: m.race_wolvir
}

export function getRaceLabel(race?: number | null): string {
	if (race === null || race === undefined) return '—'
	const messageFn = RACE_MESSAGES[race]
	return messageFn ? messageFn() : '—'
}

export function getRaceIcon(race?: number | null): string {
	if (race === null || race === undefined) return ''
	const label = RACE_LABELS[race]
	if (!label) return ''
	return `${getBasePath()}/labels/race/Label_Race_${label}.png`
}

export function getRaceOptions() {
	// Add "None" option for empty selection
	const options = [
		{ value: null as unknown as number, label: m.proficiency_none() },
		...Object.entries(RACE_MESSAGES).map(([value, messageFn]) => ({
			value: Number(value),
			label: messageFn()
		}))
	]
	return options
}
