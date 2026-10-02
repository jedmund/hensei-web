// Content-Security-Policy for granblue.team, applied through SvelteKit's
// `kit.csp` (see svelte.config.js). Plain JS so the config file can import it
// before Vite runs.
//
// Each allowed host is somewhere injected script could send data, so keep the
// lists short. Link-preview images go through /api/og/image for that reason.
// Design notes: docs/prds/content-security-policy-prd.md (workspace repo).

/** @typedef {import('@sveltejs/kit').Csp.Source} Source */
/** @typedef {import('@sveltejs/kit').CspDirectives} CspDirectives */
/** @typedef {'off' | 'report-only' | 'enforce'} CspMode */

export const CSP_REPORT_PATH = '/api/csp-report'

/** @type {CspMode[]} */
export const CSP_MODES = ['off', 'report-only', 'enforce']

// Game CDN for item and enemy images (src/lib/utils/images.ts).
const GAME_IMAGE_HOSTS = [
	'https://prd-game-a-granbluefantasy.akamaized.net',
	'https://prd-game-a1-granbluefantasy.akamaized.net'
]
// YouTube thumbnails for team and playlist videos.
const YOUTUBE_THUMBNAIL_HOST = 'https://img.youtube.com'
// The video dialog embeds the privacy-enhanced player.
const YOUTUBE_EMBED_HOST = 'https://www.youtube-nocookie.com'
// Icon stylesheet and font for the admin data grid.
const SVAR_HOST = 'https://cdn.svar.dev'
// Wiki lookups on the admin database pages (src/lib/api/wiki.ts).
const WIKI_HOST = 'https://gbf.wiki'

/**
 * The origin of a URL, or null when it's missing or invalid.
 * @param {string | undefined} raw
 * @returns {Source | null}
 */
function originOf(raw) {
	if (!raw) return null
	try {
		const url = new URL(raw)
		if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
		return /** @type {Source} */ (url.origin)
	} catch {
		return null
	}
}

/**
 * @param {Array<Source | null>} sources
 * @returns {Source[]}
 */
function compact(sources) {
	return [...new Set(sources.filter((s) => s !== null))]
}

/**
 * Builds the policy's directives. Hosts that differ between environments come
 * from the public env vars; for Sentry only the host is kept, never the key.
 *
 * @param {{ apiUrl?: string, imgUrl?: string, sentryDsn?: string }} env
 * @returns {CspDirectives}
 */
export function buildCspDirectives({ apiUrl, imgUrl, sentryDsn }) {
	const api = originOf(apiUrl)
	const images = originOf(imgUrl)
	const sentry = originOf(sentryDsn)

	return {
		'default-src': ['self'],
		// SvelteKit adds a per-request nonce for its own inline scripts and the
		// theme script in app.html.
		'script-src': ['self'],
		// Inline styles are allowed on purpose: Svelte style bindings and
		// transitions, echarts and Tiptap all set them. SvelteKit adds no style
		// nonce while 'unsafe-inline' is present (a nonce would disable it).
		'style-src': ['self', 'unsafe-inline', SVAR_HOST],
		'img-src': compact([
			'self',
			'data:',
			'blob:',
			images,
			...GAME_IMAGE_HOSTS,
			YOUTUBE_THUMBNAIL_HOST
		]),
		// data: for the small KaTeX fonts Vite inlines into the stylesheet. Inline
		// fonts can't send data anywhere.
		'font-src': compact(['self', 'data:', images, SVAR_HOST]),
		'connect-src': compact(['self', api, sentry, WIKI_HOST]),
		'frame-src': [YOUTUBE_EMBED_HOST],
		'frame-ancestors': ['none'],
		'base-uri': ['self'],
		'form-action': ['self'],
		'object-src': ['none']
	}
}

/**
 * @param {string | undefined} raw
 * @param {CspMode} fallback
 * @returns {CspMode}
 */
export function parseCspMode(raw, fallback) {
	return CSP_MODES.find((mode) => mode === raw) ?? fallback
}

/**
 * Maps a mode to SvelteKit's `kit.csp` option. Enforcing keeps the same policy
 * in report-only form too, so violations are still reported once it blocks.
 *
 * @param {CspMode} mode
 * @param {CspDirectives} directives
 * @returns {{ mode: 'auto', directives?: CspDirectives, reportOnly?: CspDirectives }}
 */
export function cspConfig(mode, directives) {
	if (mode === 'off') return { mode: 'auto' }

	/** @type {CspDirectives} */
	const reportOnly = { ...directives, 'report-uri': [CSP_REPORT_PATH] }
	if (mode === 'report-only') return { mode: 'auto', reportOnly }
	return { mode: 'auto', directives, reportOnly }
}
