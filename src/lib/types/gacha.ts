export interface CatalogueItem {
	identity: string
	drawable_type: 'Weapon' | 'Summon'
	drawable_id: string
	granblue_id: string
	name: { en: string; ja: string }
	rarity: number
	element: number
	promotions: number[]
	recruits?: { en: string; ja: string } | null
	count?: string
}
export interface GachaConfiguration {
	mode: string
	season?: string | null
	purchase?: 'singles' | 'ten'
	rateups?: { identity: string; percent: number | string }[]
}
export interface GachaResult {
	draws: string
	seed: string
	configuration: GachaConfiguration
	catalogue_fingerprint: string
	engine_version: string
	label: string
	ordered?: CatalogueItem[] | null
	items?: CatalogueItem[]
	totals?: { R: string; SR: string; SSR: string }
	copies?: string
	target?: string
	comparison?: string
	requested_copies?: string
	probability?: number
	expected_copies?: number
	thresholds?: Record<string, string | null>
	cost: {
		crystals: string
		jpy: string
		usd: string | null
		label: string
		exchange_rate: { provider: string; date: string; jpy_per_usd: string; stale: boolean } | null
	}
}
