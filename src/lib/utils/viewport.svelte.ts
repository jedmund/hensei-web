import { page } from '$app/state'
import { MediaQuery } from 'svelte/reactivity'

/** The app's phone breakpoint; matches the `max-width: 768px` styles */
export const MOBILE_QUERY = '(max-width: 768px)'

/**
 * A `MediaQuery` for a phone-width breakpoint that renders correctly on the
 * server.
 *
 * `MediaQuery` is always `false` during SSR unless given a fallback, so
 * markup chosen from it was rendered for desktop and swapped after
 * hydration. This uses the root layout's `isMobileHint` (from the request,
 * see `utils/device.ts`) as that fallback, so phones get the right markup in
 * the first HTML. In the browser it's an ordinary `MediaQuery`.
 *
 * Call it during component initialization, like any rune-based helper: it
 * reads the current request's data from `page`, so it must not be created in
 * module scope (on the server that would be shared between requests).
 */
export function mobileQuery(query: string = MOBILE_QUERY): MediaQuery {
	return new MediaQuery(query, page.data?.isMobileHint === true)
}
