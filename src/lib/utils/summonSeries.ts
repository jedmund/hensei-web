/**
 * Summon Series Utilities
 *
 * Helpers for picking summon art from the API-driven SummonSeriesRef type.
 *
 * @module utils/summonSeries
 */

import type { SummonSeriesRef, SummonSeriesSummary } from '$lib/types/api/summonSeries'

/** Full series ref or the slug-only summary sent in party list views */
type SeriesInput = SummonSeriesRef | SummonSeriesSummary | null | undefined

/**
 * Slugs for series whose only alternate art is at ULB ({id}_02 at uncap 5).
 *
 * These summons don't transcend, so they never have {id}_03/{id}_04 art.
 * Primal and Omega summons follow a different progression and are keyed by
 * id in `SUMMON_ALT_ART_THRESHOLD` instead.
 */
export const SUMMON_ULB_ART_SLUGS = ['odious']

/**
 * Check whether a summon series has distinct artwork at ULB.
 *
 * Accepts the trimmed series from party list views as well as the full ref,
 * since only the slug is needed.
 *
 * @param series - The series to check (SummonSeriesRef, SummonSeriesSummary or null)
 * @returns True if the series ships ULB art
 */
export function seriesHasUlbArt(series: SeriesInput): boolean {
	if (typeof series?.slug !== 'string') {
		return false
	}
	return SUMMON_ULB_ART_SLUGS.includes(series.slug)
}
