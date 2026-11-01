/**
 * URL state for the database record panel (GBF-140).
 *
 * The open record lives in `?open=<id>` next to the list's own params
 * (`view`, filters, `page`, search), so a panel can be shared, reloaded and
 * closed with Back.
 *
 * Ids are each resource's route ids: granblueIds, or slugs for records
 * without one (weapon series). Style-swap characters share their base
 * character's granblueId, so their id carries a `-style` suffix to stay
 * unique in a result set (`3040xxx000-style` →
 * `/database/characters/3040xxx000/style`); only characters' ids are read
 * that way, so a slug may end in `-style`.
 */

import type { ResourceName } from '$lib/features/database/schema/names'

export const OPEN_PARAM = 'open'

/** Resources whose records can open in the panel: the registered ones, and those not yet migrated */
export type PanelResource = ResourceName

const STYLE_SUFFIX = '-style'

/** The open record id, or null when the panel is closed. */
export function readOpen(url: URL): string | null {
	const value = url.searchParams.get(OPEN_PARAM)
	return value ? value : null
}

/** A copy of `url` with `?open=` set to `id`, or removed for null. Other params are kept. */
export function withOpen(url: URL, id: string | null): URL {
	const next = new URL(url)
	if (id) next.searchParams.set(OPEN_PARAM, id)
	else next.searchParams.delete(OPEN_PARAM)
	return next
}

/** Path + query of a URL, for goto() on the same origin. */
export function relativeHref(url: URL): string {
	return `${url.pathname}${url.search}${url.hash}`
}

/** Copy `keys` from `from` onto `href` (a path with optional query), keeping its own params. */
export function preserveParams(href: string, from: URL, keys: readonly string[]): string {
	const target = new URL(href, from.origin)
	for (const key of keys) {
		const value = from.searchParams.get(key)
		if (value !== null && !target.searchParams.has(key)) target.searchParams.set(key, value)
	}
	return relativeHref(target)
}

export function recordId(granblueId: string, styleSwap = false): string {
	return styleSwap ? `${granblueId}${STYLE_SUFFIX}` : granblueId
}

/** A panel id as its route id, and whether it's a style shift (characters only) */
export function parseRecordId(
	resource: PanelResource,
	id: string
): { routeId: string; styleSwap: boolean } {
	if (resource === 'characters' && id.endsWith(STYLE_SUFFIX)) {
		return { routeId: id.slice(0, -STYLE_SUFFIX.length), styleSwap: true }
	}
	return { routeId: id, styleSwap: false }
}

/** Full-page path for a record (unlocalized). */
export function recordPath(resource: PanelResource, id: string): string {
	const { routeId, styleSwap } = parseRecordId(resource, id)
	return `/database/${resource}/${routeId}${styleSwap ? '/style' : ''}`
}
