export interface CatalogueItem {
	identity: string
	drawable_type: 'Weapon' | 'Summon'
	drawable_id: string
	granblue_id: string
	name: { en: string; ja: string }
	rarity: number
	element: number
	promotions: number[]
	category?: 'characterWeapon' | 'weapon' | 'summon'
	recruits?: { granblue_id?: string; en: string; ja: string } | null
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
	ssr_order?: string[] | null
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

/**
 * Everything the internal share-image route needs to draw a result. The public
 * image endpoint runs the simulation, stores this with storePrefetch, and the
 * _render/gacha/result route reads it back with consumePrefetch.
 */
export interface GachaRenderData {
	result: GachaResult
	operation: 'draw' | 'until' | 'odds'
	currency: 'usd' | 'jpy' | 'crystals'
	art: 'weapon' | 'character'
}
