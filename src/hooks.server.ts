import type { Handle, HandleFetch } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { handleErrorWithSentry, init, sentryHandle } from '@sentry/sveltekit'
import { env as publicEnv } from '$env/dynamic/public'
import { paraglideMiddleware } from '$lib/paraglide/server'
import { SENTRY_IGNORE_ERRORS, SENTRY_TRACES_SAMPLE_RATE } from '$lib/sentry'
import { dev } from '$app/environment'
import {
	clearAuthCookies,
	getAccountFromCookies,
	getRefreshFromCookies,
	getUserFromCookies
} from '$lib/auth/cookies'
import { performRefresh } from '$lib/auth/refresh'
import { PUBLIC_SIERO_API_URL } from '$env/static/public'
import { generateFontFaceCSS, getFontPreloadLinks } from '$lib/utils/fonts'

// Only initialize when a DSN is configured (keeps dev/test silent).
if (publicEnv.PUBLIC_SENTRY_DSN) {
	init({
		dsn: publicEnv.PUBLIC_SENTRY_DSN,
		environment: publicEnv.PUBLIC_SENTRY_ENVIRONMENT || 'production',
		tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
		ignoreErrors: SENTRY_IGNORE_ERRORS
	})
}

const BOT_PATHS = [
	'/wp-admin',
	'/wp-content',
	'/wp-includes',
	'/wp-login',
	'/wp-json',
	'/xmlrpc.php',
	'/.env',
	'/.well-known/traffic-advice',
	'/phpmyadmin',
	'/cgi-bin',
	'/administrator'
]

const handleBotFilter: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname
	if (BOT_PATHS.some((prefix) => path.startsWith(prefix))) {
		return new Response('Not found', { status: 404 })
	}
	return resolve(event)
}

export const handleSession: Handle = async ({ event, resolve }) => {
	let account = getAccountFromCookies(event.cookies)
	let user = getUserFromCookies(event.cookies)

	// Heal cookies from the pre-#835 refresh bug: the old /auth/refresh
	// wrote an account cookie without expires_at, which made the client
	// bail during hydration and enter a visible refresh loop. Users who
	// hit that path before the fix shipped are still stuck. Detect the
	// broken shape and exchange the refresh cookie for a fresh pair so
	// they recover silently.
	if (account?.token && !account.expires_at) {
		const healed = await performRefresh(event.cookies, event.fetch)
		if (healed.ok) {
			account = getAccountFromCookies(event.cookies)
		} else if (healed.reason === 'refresh_unauthorized') {
			// performRefresh already cleared cookies; drop local state too.
			account = null
			user = null
		}
		// On refresh_failed (transient backend error), leave the broken
		// cookie in place and try again on the next request.
	}

	// Unjam users whose refresh cookie has been purged by the browser
	// (e.g. because #835 tied its lifetime to the access token). They
	// still have a valid-looking account cookie, so the client hydrates
	// as authenticated, calls /auth/refresh, gets 401, redirects to
	// /auth/login, and SSR rehydrates the stale cookie — a tight loop.
	// Drop the cookies here so the user lands in a clean unauthenticated
	// state and can log in once to recover.
	if (account?.token && !getRefreshFromCookies(event.cookies)) {
		clearAuthCookies(event.cookies)
		account = null
		user = null
	}

	event.locals.session = {
		account,
		user,
		isAuthenticated: Boolean(account?.token)
	}

	// Sync PARAGLIDE_LOCALE cookie from user language preference
	// This runs before handleParaglide so the correct locale is used for rendering
	if (user?.language && user.language !== 'en') {
		if (event.cookies.get('PARAGLIDE_LOCALE') !== user.language) {
			event.cookies.set('PARAGLIDE_LOCALE', user.language, {
				path: '/',
				httpOnly: false,
				sameSite: 'lax',
				secure: !dev,
				maxAge: 34560000
			})
		}
	} else if (user?.language === 'en' && event.cookies.get('PARAGLIDE_LOCALE')) {
		event.cookies.delete('PARAGLIDE_LOCALE', { path: '/' })
	}

	// Pass auth data for client-side auth store initialization
	event.locals.auth = account?.token
		? {
				accessToken: account.token,
				user: {
					id: account.userId,
					username: account.username
				},
				expiresAt: account.expires_at ?? ''
			}
		: null

	return resolve(event)
}

// Generate font CSS and preload links once at startup
const fontCSS = generateFontFaceCSS()
const fontPreloads = getFontPreloadLinks()

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request

		return resolve(event, {
			transformPageChunk: ({ html }) => {
				// Inject font preloads and @font-face CSS into the head
				const fontStyle = `<style id="font-faces">${fontCSS}</style>`
				html = html.replace('</head>', `${fontPreloads}\n${fontStyle}\n</head>`)
				return html.replace('%paraglide.lang%', locale)
			}
		})
	})

// sentryHandle() runs first so it captures errors from the downstream handlers
// and sets up per-request isolation for the SSR scope.
export const handle: Handle = sequence(
	sentryHandle(),
	handleBotFilter,
	handleSession,
	handleParaglide
)

// Reports uncaught server (SSR / load / action) errors to Sentry, then falls
// through to SvelteKit's default rendering. No-op when the SDK isn't initialized.
export const handleError = handleErrorWithSentry()

const apiOrigin = new URL(PUBLIC_SIERO_API_URL || 'http://localhost:3000/api/v1').origin

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
	const url = new URL(request.url)
	if (url.origin === apiOrigin) {
		const token = event.locals.session?.account?.token
		if (token) {
			request = new Request(request, {
				headers: new Headers({
					...Object.fromEntries(request.headers),
					authorization: `Bearer ${token}`
				})
			})
		}
	}

	return fetch(request)
}
