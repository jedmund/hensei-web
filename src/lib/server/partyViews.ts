/**
 * Team page views for Trending. The team page reports a view after it has
 * rendered in the browser (preloads never mount it), and the view route
 * forwards it to the API through handleFetch, which adds the internal secret,
 * the visitor's IP and their session. The API dedupes per viewer per JST day.
 */

import { isbot } from 'isbot'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isPrefetch(request: Request): boolean {
	const purpose = `${request.headers.get('sec-purpose') ?? ''} ${request.headers.get('purpose') ?? ''}`
	return /prefetch|prerender/i.test(purpose)
}

/** Crawlers, link unfurlers, headless browsers and HTTP libraries (isbot's
 * maintained list). Real browsers always send a user agent. */
export function isLikelyBot(userAgent: string | null): boolean {
	return !userAgent || isbot(userAgent)
}

/** Whether a view report should be passed on to the API. */
export function shouldRecordView(request: Request, partyId: string): boolean {
	return (
		UUID.test(partyId) && !isPrefetch(request) && !isLikelyBot(request.headers.get('user-agent'))
	)
}
