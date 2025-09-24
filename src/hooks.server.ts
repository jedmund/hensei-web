import type { Handle, HandleFetch } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { paraglideMiddleware } from '$lib/paraglide/server'
import { getAccountFromCookies, getUserFromCookies } from '$lib/auth/cookies'
import { PUBLIC_SIERO_API_URL } from '$env/static/public'

export const handleSession: Handle = async ({ event, resolve }) => {
	const account = getAccountFromCookies(event.cookies)
	const user = getUserFromCookies(event.cookies)

	// Debug logging for auth issues
	if (account) {
		console.log('[hooks.server] Account cookie found:', {
			hasToken: !!account.token,
			hasExpiresAt: !!account.expires_at,
			username: account.username
		})
	}

	event.locals.session = {
		account,
		user,
		isAuthenticated: Boolean(account?.token)
	}

	// Pass auth data for client-side auth store initialization
	event.locals.auth = account?.token
		? {
				accessToken: account.token,
				user: user,
				expiresAt: account.expires_at
		  }
		: null

	return resolve(event)
}

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		})
	})

export const handle: Handle = sequence(handleSession, handleParaglide)

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
