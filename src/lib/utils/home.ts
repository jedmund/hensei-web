/**
 * Pure helpers for the home page sections.
 */

import type { HomeRaidSection } from '$lib/types/api/home'
import { ELEMENT_TO_PARAM } from '$lib/utils/filterParams'

const MINUTE_MS = 60 * 1000

/** Raids that have at least one team, in API order */
export function raidsWithParties(raids: HomeRaidSection[]): HomeRaidSection[] {
	return raids.filter((r) => r.parties.length > 0)
}

/** Whole days, hours and minutes until `target`, or null once it has passed */
export function countdown(
	target: string,
	now: number = Date.now()
): { days: number; hours: number; minutes: number } | null {
	const at = Date.parse(target)
	if (Number.isNaN(at) || at <= now) return null
	const minutesLeft = Math.ceil((at - now) / MINUTE_MS)
	return {
		days: Math.floor(minutesLeft / (24 * 60)),
		hours: Math.floor((minutesLeft % (24 * 60)) / 60),
		minutes: minutesLeft % 60
	}
}

/**
 * Query string for a Gallery link from a home section. Only the raid, an
 * event element (Unite and Fight) and the sort carry over.
 */
export function exploreQuery(opts: {
	raidSlug?: string | undefined
	element?: number | null | undefined
	sort?: 'participation' | undefined
}): string {
	const params = new URLSearchParams()
	if (opts.raidSlug) params.set('raid', opts.raidSlug)
	if (opts.element) {
		const element = ELEMENT_TO_PARAM[opts.element]
		if (element && element !== 'null') params.set('element', element)
	}
	if (opts.sort) params.set('sort', opts.sort)
	const query = params.toString()
	return query ? `?${query}` : ''
}
