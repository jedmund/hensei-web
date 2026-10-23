import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import { clearAuthCookies } from '$lib/auth/cookies'
import {
	createExtensionCode,
	EXTENSION_AUTH_PARAMS,
	parseExtensionAuthRequest,
	successRedirect,
	type CreateCodeResult
} from '$lib/server/extensionAuth'

const NO_STORE = { 'cache-control': 'no-store' }

const failure = (status: number, error: string) => json({ error }, { status, headers: NO_STORE })

/**
 * POST /auth/extension/code: the Continue button on /auth/extension.
 *
 * Creates a one-time code with the session's token and returns
 * `{ url: redirect_uri?code&state }` for the page to navigate to. It returns
 * the URL rather than redirecting because the CSP's form-action also covers
 * redirects after a form submission, which would block chromiumapp.org.
 *
 * JSON only: a cross-site page can't send a JSON POST without a CORS
 * preflight, which this server never allows.
 */
export const POST: RequestHandler = async ({ request, locals, cookies, fetch }) => {
	const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
	if (contentType !== 'application/json') return failure(415, 'unsupported_media_type')

	const raw: unknown = await request.json().catch(() => null)
	if (!raw || typeof raw !== 'object') return failure(400, 'invalid_request')

	const params = new URLSearchParams()
	for (const name of EXTENSION_AUTH_PARAMS) {
		const value = (raw as Record<string, unknown>)[name]
		if (typeof value === 'string') params.set(name, value)
	}
	const parsed = parseExtensionAuthRequest(params)
	if (!parsed.ok) return failure(400, 'invalid_request')

	const token = locals.session.account?.token
	if (!locals.session.isAuthenticated || !token) return failure(401, 'unauthorized')

	let result: CreateCodeResult
	try {
		result = await createExtensionCode(fetch, token, parsed.request)
	} catch (e) {
		console.warn(
			`[extension-auth] code request failed: ${e instanceof Error ? e.constructor.name : typeof e}`
		)
		result = { kind: 'failed' }
	}

	switch (result.kind) {
		case 'created':
			return json({ url: successRedirect(parsed.request, result.code) }, { headers: NO_STORE })
		case 'unauthorized':
			// The session's token no longer works: log out so the page sends the
			// user to log in again.
			clearAuthCookies(cookies)
			return failure(401, 'unauthorized')
		case 'rate_limited':
			return failure(429, 'rate_limited')
		case 'failed':
			return failure(502, 'failed')
	}
}
