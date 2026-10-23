import type { Handle } from '@sveltejs/kit'
import { dev } from '$app/environment'

/**
 * SvelteKit's CSRF origin check, with a single exemption.
 *
 * Sign in with Apple returns as a cross-site form POST
 * (response_mode=form_post) to /auth/apple/callback, which the built-in
 * check rejects and can't exempt per route. svelte.config.js turns the
 * built-in check off (`csrf.trustedOrigins: ['*']`) and this hook applies the
 * same rule to every other request. The Apple callback relies on its `state`
 * parameter instead.
 *
 * Mirrors @sveltejs/kit's runtime/server/respond.js: form content types,
 * unsafe methods, and an Origin that isn't ours. Like SvelteKit, it only runs
 * outside development.
 */

const FORM_CONTENT_TYPES = [
	'application/x-www-form-urlencoded',
	'multipart/form-data',
	'text/plain',
	// SvelteKit's binary form encoding for remote form functions
	'application/x-sveltekit-formdata'
]

const UNSAFE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

// Paths may carry a locale prefix (e.g. /ja/auth/apple/callback).
const EXEMPT_POST_PATHS = [/^(?:\/[a-z]{2})?\/auth\/apple\/callback\/?$/]

function isFormContentType(request: Request): boolean {
	const type = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() ?? ''
	return FORM_CONTENT_TYPES.includes(type)
}

export function isExemptFromCsrf(method: string, pathname: string): boolean {
	return method === 'POST' && EXEMPT_POST_PATHS.some((path) => path.test(pathname))
}

/** A 403 for a cross-site form submission, or null to let the request through. */
export function csrfResponse(request: Request, url: URL): Response | null {
	const origin = request.headers.get('origin')
	const forbidden =
		isFormContentType(request) &&
		UNSAFE_METHODS.includes(request.method) &&
		origin !== url.origin &&
		!isExemptFromCsrf(request.method, url.pathname)

	if (!forbidden) return null

	const message = `Cross-site ${request.method} form submissions are forbidden`
	if (request.headers.get('accept') === 'application/json') {
		return new Response(JSON.stringify({ message }), {
			status: 403,
			headers: { 'content-type': 'application/json' }
		})
	}
	return new Response(message, { status: 403, headers: { 'content-type': 'text/plain' } })
}

export const handleCsrf: Handle = async ({ event, resolve }) =>
	(dev ? null : csrfResponse(event.request, event.url)) ?? resolve(event)
