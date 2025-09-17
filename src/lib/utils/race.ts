/**
 * Race mapping utilities for Granblue Fantasy
 */

export const RACE_LABELS: Record<number, string> = {
	0: 'Unknown',
	1: 'Human',
	2: 'Erune',
	3: 'Draph',
	4: 'Harvin',
	5: 'Primal'
}

export function getRaceLabel(race?: number | null): string {
	if (race === null || race === undefined) return '—'
	return RACE_LABELS[race] || '—'
}

export function getRaceIcon(race?: number | null): string {
	const label = getRaceLabel(race)
	if (label === '—' || label === 'Unknown') return ''
	return `/images/labels/race/Label_Race_${label}.png`
}