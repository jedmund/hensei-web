/**
 * Whether a request most likely comes from a phone.
 *
 * The server can't see the viewport, so this is only a hint for the first
 * render: components that pick their markup from a media query use it as the
 * server-side value (see `viewport.svelte.ts`), so phones get the mobile
 * markup in the HTML instead of the desktop one swapped out after hydration.
 *
 * Chromium sends `Sec-CH-UA-Mobile` by default; Safari and Firefox don't, so
 * the user agent is the fallback. Tablets (including iPadOS, which reports a
 * desktop user agent) count as not mobile, which matches the 768px breakpoint.
 */
const MOBILE_UA = /Mobi|iPhone|iPod|Android.+Mobile|Windows Phone/i

export function isMobileRequest(headers: Headers): boolean {
	const hint = headers.get('sec-ch-ua-mobile')
	if (hint === '?1') return true
	if (hint === '?0') return false

	return MOBILE_UA.test(headers.get('user-agent') ?? '')
}
