/**
 * The pool and season the spark maker's picker can be narrowed to: the gacha
 * the spark was on. An item is offered the way the gacha simulator decides
 * it (GachaSimulation::Configuration.eligible?): ordinary Premium items are in
 * every pool but Classic, limited items only in their own pool or season, and
 * Classic pools hold only their own items.
 */

import { m } from '$lib/paraglide/messages'
import { Promotion } from '$lib/types/enums'
import type { CatalogueItem } from '$lib/types/gacha'

export interface SparkPromotion {
	value: string
	/** Short, for the dropdown */
	label: () => string
	/** In full, for a saved spark's name, e.g. "Flash Gala" */
	name: () => string
	promotion: Promotion
}

export const SPARK_POOLS: SparkPromotion[] = [
	{
		value: 'premium',
		label: m.gacha_premium,
		name: m.gacha_pool_premium,
		promotion: Promotion.Premium
	},
	{ value: 'flash', label: m.gacha_flash, name: m.gacha_pool_flash, promotion: Promotion.Flash },
	{
		value: 'legend',
		label: m.gacha_legend,
		name: m.gacha_pool_legend,
		promotion: Promotion.Legend
	},
	{
		value: 'collab',
		label: m.spark_pool_collab,
		name: m.spark_pool_name_collab,
		promotion: Promotion.Collab
	},
	{
		value: 'classic',
		label: m.gacha_classic,
		name: m.spark_pool_name_classic,
		promotion: Promotion.Classic
	},
	{
		value: 'classic_ii',
		label: m.gacha_classic_ii,
		name: m.spark_pool_name_classic_ii,
		promotion: Promotion.ClassicII
	},
	{
		value: 'classic_iii',
		label: m.gacha_classic_iii,
		name: m.spark_pool_name_classic_iii,
		promotion: Promotion.ClassicIII
	}
]

const season = (value: string, label: () => string, promotion: Promotion): SparkPromotion => ({
	value,
	label,
	name: label,
	promotion
})

export const SPARK_SEASONS: SparkPromotion[] = [
	season('valentines', m.gacha_valentines, Promotion.Valentine),
	season('summer', m.gacha_summer, Promotion.Summer),
	season('halloween', m.gacha_halloween, Promotion.Halloween),
	season('holiday', m.gacha_holiday, Promotion.Holiday),
	season('formal', m.gacha_formal, Promotion.Formal)
]

const CLASSIC = new Set([Promotion.Classic, Promotion.ClassicII, Promotion.ClassicIII])

export const findPromotion = (list: SparkPromotion[], value: string | null | undefined) =>
	list.find((entry) => entry.value === value)

/** Seasons run on the Premium-type pools; Classic and Collab have none */
export function poolTakesSeason(pool: string | null | undefined): boolean {
	const entry = findPromotion(SPARK_POOLS, pool)
	return !entry || (!CLASSIC.has(entry.promotion) && entry.promotion !== Promotion.Collab)
}

/**
 * Whether an item can be drawn from a pool and season. No pool and no season
 * offers everything; a season with no pool means the Premium pool's season.
 */
export function inPool(
	item: CatalogueItem,
	pool: string | null | undefined,
	season?: string | null
): boolean {
	const seasonEntry = poolTakesSeason(pool) ? findPromotion(SPARK_SEASONS, season) : undefined
	const poolEntry = findPromotion(SPARK_POOLS, pool) ?? (seasonEntry ? SPARK_POOLS[0] : undefined)
	if (!poolEntry) return true
	if (item.promotions.includes(poolEntry.promotion)) return true
	if (seasonEntry && item.promotions.includes(seasonEntry.promotion)) return true
	return !CLASSIC.has(poolEntry.promotion) && item.promotions.includes(Promotion.Premium)
}
