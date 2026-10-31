/**
 * URL state for the database record panel (GBF-140).
 *
 * The open record lives in `?open=<id>` next to the list's own params
 * (`view`, filters, `page`, search), so a panel can be shared, reloaded and
 * closed with Back.
 *
 * Ids are granblueIds. Style-swap characters share their base character's
 * granblueId, so their id carries a `-style` suffix to stay unique in a
 * result set (`3040xxx000-style` → `/database/characters/3040xxx000/style`).
 */

export const OPEN_PARAM = 'open'

/** Resources whose records can open in the panel */
export type PanelResource = 'weapons' | 'characters' | 'summons' | 'jobs'

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

export function parseRecordId(id: string): { granblueId: string; styleSwap: boolean } {
	if (id.endsWith(STYLE_SUFFIX)) {
		return { granblueId: id.slice(0, -STYLE_SUFFIX.length), styleSwap: true }
	}
	return { granblueId: id, styleSwap: false }
}

/** Full-page path for a record (unlocalized). */
export function recordPath(resource: PanelResource, id: string): string {
	const { granblueId, styleSwap } = parseRecordId(id)
	const style = resource === 'characters' && styleSwap ? '/style' : ''
	return `/database/${resource}/${granblueId}${style}`
}
