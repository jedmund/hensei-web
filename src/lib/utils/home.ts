/**
 * Pure helpers for the home page sections.
 */

import type { GameEvent } from '$lib/types/api/event'
import type { HomeRaidSection } from '$lib/types/api/home'
import { ELEMENT_TO_PARAM } from '$lib/utils/filterParams'
import { getHostedImageUrl } from '$lib/utils/images/core'
import { getRaidImage } from '$lib/utils/images/raids'
import { appLocale } from '$lib/utils/locale'
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
 * An event's banner in the reader's language. Japanese readers get the
 * Japanese banner (the English art has English text baked in) with the
 * English one as `fallback`, since a series' Japanese banner may not exist
 * yet; everyone else gets the English one and no fallback.
 */
export function eventBanner(event: Pick<GameEvent, 'imageUrl' | 'imageUrlJa'>): {
	src: string | null
	fallback: string | null
} {
	const english = getHostedImageUrl(event.imageUrl)
	const japanese = appLocale() === 'ja' ? getHostedImageUrl(event.imageUrlJa) : null
	return japanese ? { src: japanese, fallback: english } : { src: english, fallback: null }
}

/**
 * An event's thumbnail: its banner in the reader's language (the API falls
 * back to its series' banner), else the art of its first raid. `raidSlug`
 * overrides which raid. Show the event's name when this is null or the image
 * fails to load; `eventBanner(event).fallback` is the image to try first.
 */
export function eventThumbnailUrl(
	event: Pick<GameEvent, 'imageUrl' | 'imageUrlJa' | 'raids'>,
	raidSlug?: string | undefined
): string | null {
	const slug = raidSlug ?? event.raids?.[0]?.slug
	return eventBanner(event).src ?? (slug ? getRaidImage(slug, 'thumbnail') : null)
}

/**
 * The elements players bring to an event: one, or two when it has a second
 * boss element (Records of the Ten's Fire and Dark run). Empty without one.
 */
export function eventAdvantageElements(
	event: Pick<GameEvent, 'advantageElement' | 'advantageElements'>
): number[] {
	if (event.advantageElements) return event.advantageElements
	return event.advantageElement ? [event.advantageElement] : []
}

/**
 * Query string for a Gallery link from a home section. Only the raid, an
 * event's elements (Unite and Fight) and the sort carry over.
 */
export function exploreQuery(opts: {
	raidSlug?: string | undefined
	elements?: number[] | undefined
	sort?: 'rising' | undefined
}): string {
	const params = new URLSearchParams()
	if (opts.raidSlug) params.set('raid', opts.raidSlug)
	const elements = (opts.elements ?? [])
		.map((e) => ELEMENT_TO_PARAM[e])
		.filter((e) => e && e !== 'null')
	if (elements.length > 0) params.set('element', elements.join(','))
	if (opts.sort) params.set('sort', opts.sort)
	const query = params.toString()
	return query ? `?${query}` : ''
}
