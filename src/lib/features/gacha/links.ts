/**
 * The simulator's settings as a link: what the page opens with, the query
 * string the form's settings make, and a result's link (those settings plus
 * its seed). The format itself lives in `$lib/utils/gachaShare`.
 */

import type { Rateup } from '$lib/components/gacha/GachaRateups.svelte'
import { gachaGranblueIdFor, gachaIdentityFor } from '$lib/utils/gacha'
import {
	CURRENT_BANNER,
	readShare,
	writeShare,
	type GachaOperation,
	type GachaShare
} from '$lib/utils/gachaShare'
import type { CatalogueItem, GachaResult } from '$lib/types/gacha'
import { hasFixedRates, isClassic } from './pools'

/** The form's settings, with items as catalogue identities */
export interface GachaSettings {
	operation: GachaOperation
	mode: string
	season: string
	purchase: GachaShare['purchase']
	/** Number inputs bind numbers; the URL gives strings */
	draws: string | number
	copies: string | number
	comparison: GachaShare['comparison']
	target: string
	rateups: Rateup[]
}

/**
 * Settings the page opens with. A fresh visit opens on the game's current
 * banner; links with settings keep theirs, since they leave Premium out of
 * the query.
 */
export function initialShare(url: URL): GachaShare {
	const share = readShare(url.searchParams)
	return url.search ? share : { ...share, mode: CURRENT_BANNER }
}

/** A result's link: its settings, its seed and, for the current banner, the banner it came from */
export function resultLink(settings: string, result: GachaResult): string {
	const { mode: pool, banner: pin } = result.configuration ?? {}
	return [
		settings,
		`seed=${encodeURIComponent(result.seed)}`,
		pool === CURRENT_BANNER && pin ? `banner=${encodeURIComponent(pin)}` : ''
	]
		.filter(Boolean)
		.join('&')
}

/** Query string for the form's settings, without a seed */
export function settingsQuery(settings: GachaSettings, items: CatalogueItem[]): string {
	const fixedRates = hasFixedRates(settings.mode)
	return writeShare({
		operation: settings.operation,
		mode: settings.mode,
		season: isClassic(settings.mode) || fixedRates ? '' : settings.season,
		purchase: settings.purchase,
		draws: String(settings.draws),
		copies: String(settings.copies),
		comparison: settings.comparison,
		target: gachaGranblueIdFor(items, settings.target),
		rateups: fixedRates
			? []
			: settings.rateups.flatMap((rate) => {
					const id = gachaGranblueIdFor(items, rate.identity)
					return id ? [{ id, percent: String(rate.percent) }] : []
				}),
		seed: '',
		banner: ''
	})
}

/**
 * The address bar's query: the settings, plus the shown result's seed while
 * the settings still match the ones it came from
 */
export function addressQuery(
	settings: string,
	result: GachaResult | null,
	resultSettings: string
): string {
	return result && resultSettings === settings ? resultLink(settings, result) : settings
}

/** A shared link's target and rate-ups, as identities in the loaded catalogue */
export function restoreSelection(
	share: GachaShare | null,
	items: CatalogueItem[]
): { target: string; rateups: Rateup[] } {
	if (!share) return { target: '', rateups: [] }
	return {
		target: gachaIdentityFor(items, share.target),
		rateups: share.rateups.flatMap(({ id, percent }) => {
			const identity = gachaIdentityFor(items, id, 3)
			return identity ? [{ identity, percent }] : []
		})
	}
}
