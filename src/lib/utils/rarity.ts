import { getBasePath } from '$lib/utils/images'

export const RARITY_LABELS: Record<number, string> = {
	1: 'R',
	2: 'SR',
	3: 'SSR'
}

export function getRarityLabel(rarity: number): string {
	return RARITY_LABELS[rarity] || '—'
}

/**
 * Get rarity prefix for URL generation (e.g., "SSR", "SR", "R")
 * Returns empty string for unknown rarity values
 */
export function getRarityPrefix(rarity: number): string {
	return RARITY_LABELS[rarity] || ''
}

export function getRarityOptions() {
	return Object.entries(RARITY_LABELS).map(([value, label]) => ({
		value: Number(value),
		label
	}))
}

export function getRarityClass(rarity: number): string {
	switch (rarity) {
		case 1:
			return 'rarity-r'
		case 2:
			return 'rarity-sr'
		case 3:
			return 'rarity-ssr'
		default:
			return ''
	}
}

export function getRarityImage(rarity: number): string {
	const label = RARITY_LABELS[rarity]
	if (!label) return ''
	return `${getBasePath()}/rarity/${label.toLowerCase()}.png`
}