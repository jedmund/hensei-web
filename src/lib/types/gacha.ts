import type { CharacterSeriesRef } from '$lib/types/api/characterSeries'

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
	recruits?: {
		granblue_id?: string
		en: string
		ja: string
		/** For the character's tags */
		season?: number | null
		series?: (number | CharacterSeriesRef)[]
	} | null
	count?: string
	/** ISO date the item was released, when known */
	release_date?: string | null
}
export interface GachaConfiguration {
	mode: string
	season?: string | null
	purchase?: 'singles' | 'ten'
	rateups?: { identity: string; percent: number | string }[]
	/** The game banner a current-banner result was drawn from */
	banner?: string | null
}
/** A game banner whose published rates the current-banner mode draws with */
export interface GachaBanner {
	game_id: string
	name: string | null
	starts_at: string
	ends_at: string
	fetched_at: string
	/** False once it has ended and the next banner's rates haven't arrived */
	live: boolean
	/** The SSR rate as a fraction, e.g. "0.03" */
	ssr_rate: string
	/** In the catalogue only: the banner's rate-ups, with their displayed percentages */
	rateups?: { identity: string; percent: string }[]
}
export interface GachaResult {
	draws: string
	seed: string
	configuration: GachaConfiguration
	catalogue_fingerprint: string
	engine_version: string
	label: string
	banner?: GachaBanner
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
	/** The Until/Odds target, for showing its art */
	target?: CatalogueItem
}
