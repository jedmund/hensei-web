import type { Handle, HandleFetch } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { paraglideMiddleware } from '$lib/paraglide/server'
import { getAccountFromCookies, getUserFromCookies } from '$lib/auth/cookies'
import { PUBLIC_SIERO_API_URL } from '$env/static/public'
import { generateFontFaceCSS, getFontPreloadLinks } from '$lib/utils/fonts'

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
	const account = getAccountFromCookies(event.cookies)
	const user = getUserFromCookies(event.cookies)

	event.locals.session = {
		account,
		user,
		isAuthenticated: Boolean(account?.token)
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

export const handle: Handle = sequence(handleBotFilter, handleSession, handleParaglide)

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
