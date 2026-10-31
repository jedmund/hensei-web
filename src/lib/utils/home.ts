/**
 * Pure helpers for the home page sections.
 */

import type { GameEvent } from '$lib/types/api/event'
import type { HomeRaidSection } from '$lib/types/api/home'
import { ELEMENT_TO_PARAM } from '$lib/utils/filterParams'
import { getHostedImageUrl, getRaidImage } from '$lib/utils/images'
import * as m from '$lib/paraglide/messages'

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

/** "2 days 3 hours" until `target`, or '' once it has passed */
export function countdownLabel(target: string, now: number = Date.now()): string {
	const left = countdown(target, now)
	if (!left) return ''
	const parts: string[] = []
	if (left.days > 0) parts.push(m.home_duration_days({ count: left.days }))
	if (left.hours > 0) parts.push(m.home_duration_hours({ count: left.hours }))
	if (left.minutes > 0 || parts.length === 0)
		parts.push(m.home_duration_minutes({ count: left.minutes }))
	return parts.join(' ')
}

/**
 * An event's thumbnail: its header image (the API falls back to its series'
 * image), else the art of its first raid. `raidSlug` overrides which raid.
 * Show the event's name when this is null or the image fails to load.
 */
export function eventThumbnailUrl(
	event: Pick<GameEvent, 'imageUrl' | 'raids'>,
	raidSlug?: string | undefined
): string | null {
	const slug = raidSlug ?? event.raids?.[0]?.slug
	return getHostedImageUrl(event.imageUrl) ?? (slug ? getRaidImage(slug, 'thumbnail') : null)
}

/**
 * Query string for a Gallery link from a home section. Only the raid, an
 * event element (Unite and Fight) and the sort carry over.
 */
export function exploreQuery(opts: {
	raidSlug?: string | undefined
	element?: number | null | undefined
	sort?: 'rising' | undefined
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
