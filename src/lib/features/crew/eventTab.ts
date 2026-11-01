/** The two views of a GW event page */
export type EventTab = 'individual' | 'crew'

/** The crew tab is selected by a bare `?crew` query param */
export function eventTabFromUrl(url: URL): EventTab {
	return url.searchParams.has('crew') ? 'crew' : 'individual'
}

/** A copy of `url` that selects `tab` */
export function urlForEventTab(url: URL, tab: EventTab): URL {
	const next = new URL(url)
	if (tab === 'crew') {
		next.searchParams.set('crew', '')
	} else {
		next.searchParams.delete('crew')
	}
	return next
}
