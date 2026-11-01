/**
 * Pool and season rules the simulator's form applies before a draw. Which
 * items each pool holds is the API's business; the form only decides which
 * settings a pool takes.
 */

import type { Rateup } from '$lib/components/gacha/GachaRateups.svelte'
import { CURRENT_BANNER, type GachaShare } from '$lib/utils/gachaShare'
import type { CatalogueItem } from '$lib/types/gacha'
import { Promotion } from '$lib/types/enums'
import type { GachaSettings } from './links'

/** Base SSR rates, matching the API's simulation: 6% for the galas, 3% otherwise */
export const SSR_RATES: Record<string, number> = {
	premium: 0.03,
	legend: 0.06,
	flash: 0.06,
	classic: 0.03,
	classic_ii: 0.03,
	classic_iii: 0.03
}

/** Each season's draw, as the catalogue's promotion numbers */
export const SEASON_PROMOTIONS: [string, Promotion][] = [
	['valentines', Promotion.Valentine],
	['summer', Promotion.Summer],
	['halloween', Promotion.Halloween],
	['holiday', Promotion.Holiday],
	['formal', Promotion.Formal]
]

/** Classic pools have no seasons */
export const isClassic = (mode: string) => mode.startsWith('classic')

/** The current banner's rates come from the game: no seasons or custom rate-ups */
export const hasFixedRates = (mode: string) => mode === CURRENT_BANNER

/** Draws for one purchase: a 10-draw or a single draw */
export const onePurchase = (unit: GachaShare['purchase']) => (unit === 'ten' ? '10' : '1')

/**
 * The current banner's season: the one whose limited items (in that
 * season's draws but not Premium) it has most of
 */
export function bannerSeason(items: CatalogueItem[]): string {
	const counts: Record<string, number> = {}
	for (const item of items) {
		if (item.promotions.includes(Promotion.Premium)) continue
		for (const [value, promotion] of SEASON_PROMOTIONS) {
			if (item.promotions.includes(promotion)) counts[value] = (counts[value] ?? 0) + 1
		}
	}
	return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
}

/** Time left on a banner as whole days, hours and minutes, padded as the countdown shows them */
export function bannerCountdownParts(left: number): {
	days: string
	hours: string
	minutes: string
} {
	const minutes = Math.max(0, Math.floor(left / 60_000))
	const pad = (value: number) => String(value).padStart(2, '0')
	return {
		days: String(Math.floor(minutes / 1440)),
		hours: pad(Math.floor(minutes / 60) % 24),
		minutes: pad(minutes % 60)
	}
}

/** A banner's last minute, in the game's own time */
export function bannerEndTime(endsAt: string, locale: string): string {
	return new Intl.DateTimeFormat(locale, {
		timeZone: 'Asia/Tokyo',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	}).format(new Date(new Date(endsAt).getTime() - 60_000))
}

/** The catalogue query for a pool: the season only where the pool takes one */
export function catalogueSettings(mode: string, season: string): Record<string, string> {
	const settings: Record<string, string> = { mode }
	if (!isClassic(mode) && !hasFixedRates(mode) && season) settings.season = season
	return settings
}

export interface SimulationPayload {
	mode: string
	season: string | null
	purchase: GachaShare['purchase']
	draws: string | number
	copies: number
	comparison: GachaShare['comparison']
	target: string
	rateups: Rateup[]
	seed?: string
	banner?: string
}

/**
 * The simulation request for the form's settings. A seed replays a result;
 * a current-banner replay also names the banner it was drawn from.
 */
export function simulationPayload(
	settings: GachaSettings,
	seed = '',
	pinnedBanner = ''
): SimulationPayload {
	const fixedRates = hasFixedRates(settings.mode)
	return {
		mode: settings.mode,
		season: isClassic(settings.mode) || fixedRates ? null : settings.season || null,
		purchase: settings.purchase,
		draws: settings.draws,
		copies: Number(settings.copies),
		comparison: settings.comparison,
		target: settings.target,
		rateups: fixedRates ? [] : settings.rateups,
		...(seed ? { seed } : {}),
		...(seed && fixedRates && pinnedBanner ? { banner: pinnedBanner } : {})
	}
}
