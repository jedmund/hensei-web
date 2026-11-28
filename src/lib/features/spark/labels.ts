import { m } from '$lib/paraglide/messages'
import { findPromotion, SPARK_POOLS, SPARK_SEASONS } from '$lib/features/spark/pools'
import type { SparkColumn } from '$lib/features/spark/spark'
import type { SparkRenderData } from '$lib/types/spark'

/** Each column's heading, on the page and in the image */
export const SPARK_COLUMN_HEADINGS: Record<SparkColumn, () => string> = {
	characters: m.spark_column_characters,
	moons: m.spark_column_moons,
	summons: m.spark_column_summons
}

/**
 * A saved spark's name: its date, then its season and pool in full, e.g.
 * "11/15/2026 Halloween Flash Gala". A season alone is on the Premium Gala;
 * with neither, the date stands alone. Without a date, just the gacha.
 */
export function savedSparkName(
	sparkDate: string | null,
	pool: string | null,
	season: string | null,
	locale: string
): string {
	const date = sparkDate ? formatSparkDate(sparkDate, locale) : undefined
	const seasonEntry = findPromotion(SPARK_SEASONS, season)
	const poolEntry = findPromotion(SPARK_POOLS, pool) ?? (seasonEntry ? SPARK_POOLS[0] : undefined)
	return [date, seasonEntry?.name(), poolEntry?.name()].filter(Boolean).join(' ')
}

function formatSparkDate(sparkDate: string, locale: string): string {
	const [year, month, day] = sparkDate.split('-').map(Number) as [number, number, number]
	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric'
	}).format(new Date(year, month - 1, day))
}

/** SSRs drawn: everything in the spark but the sparked items */
export function drawnSsrCount(data: SparkRenderData): number {
	const total =
		data.columns.characters.length + data.columns.moons.length + data.columns.summons.length
	return total - data.sparked.length
}

/** SSRs drawn over draws, as a percentage */
export function sparkRate(data: SparkRenderData, locale: string): string {
	return new Intl.NumberFormat(locale, {
		style: 'percent',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(data.draws > 0 ? drawnSsrCount(data) / data.draws : 0)
}

/** The image's SSR rate line: its label, and the numbers, e.g. "6.00% (18/300)" */
export function sparkRateText(
	data: SparkRenderData,
	locale: string
): { label: string; value: string } {
	const count = new Intl.NumberFormat(locale)
	return {
		label: m.spark_ssr_rate_label(),
		value: m.spark_ssr_rate_value({
			rate: sparkRate(data, locale),
			ssrs: count.format(drawnSsrCount(data)),
			draws: count.format(data.draws)
		})
	}
}
