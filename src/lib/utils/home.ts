/**
 * Pure helpers for the home page sections.
 */

import type { HomeRaidSection } from '$lib/types/api/home'
import { ELEMENT_TO_PARAM } from '$lib/utils/filterParams'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

/** Raids that have at least one team, in API order */
export function raidsWithParties(raids: HomeRaidSection[]): HomeRaidSection[] {
	return raids.filter((r) => r.parties.length > 0)
}

/** Time left until `endsAt`: whole days, or hours when under a day (rounded up) */
export function timeRemaining(
	endsAt: string,
	now: number = Date.now()
): { unit: 'days' | 'hours'; value: number } | null {
	const end = Date.parse(endsAt)
	if (Number.isNaN(end) || end <= now) return null
	const left = end - now
	if (left < DAY_MS) return { unit: 'hours', value: Math.max(1, Math.ceil(left / HOUR_MS)) }
	return { unit: 'days', value: Math.ceil(left / DAY_MS) }
}

/**
 * Query string for an explore link from a home section. Only the raid, the
 * active sticker filter, an event element (Unite and Fight) and the sort
 * carry over.
 */
export function exploreQuery(opts: {
	raidSlug?: string | undefined
	sticker?: string | null | undefined
	element?: number | null | undefined
	sort?: 'participation' | undefined
}): string {
	const params = new URLSearchParams()
	if (opts.raidSlug) params.set('raid', opts.raidSlug)
	if (opts.element) {
		const element = ELEMENT_TO_PARAM[opts.element]
		if (element && element !== 'null') params.set('element', element)
	}
	if (opts.sticker) params.set('label', opts.sticker)
	if (opts.sort) params.set('sort', opts.sort)
	const query = params.toString()
	return query ? `?${query}` : ''
}
