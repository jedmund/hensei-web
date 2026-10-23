import type { PageServerLoad } from './$types'
import { error, redirect } from '@sveltejs/kit'
import { withParams } from '$lib/auth/socialResult'
import {
	cancelRedirect,
	extensionAuthParams,
	parseExtensionAuthRequest
} from '$lib/server/extensionAuth'
import { LOGIN_PATH } from '$lib/server/socialAuth/callback'

/**
 * GET /auth/extension: the browser extension's login page, opened with
 * chrome.identity.launchWebAuthFlow. Asks the logged-in user to confirm, then
 * the page posts to /auth/extension/code for the redirect URL.
 *
 * Bad params get an error page and never a redirect: an unchecked
 * redirect_uri would make this an open redirect.
 */
export const load: PageServerLoad = async ({ url, locals, setHeaders }) => {
	const parsed = parseExtensionAuthRequest(url.searchParams)
	if (!parsed.ok) {
		// The reason only, never the values.
		console.warn(`[extension-auth] rejected request: invalid ${parsed.reason}`)
		error(400, 'Invalid extension login request')
	}

	if (!locals.session.isAuthenticated || !locals.session.account) {
		redirect(302, withParams(LOGIN_PATH, { next: `${url.pathname}${url.search}` }))
	}

	setHeaders({ 'cache-control': 'no-store' })

	return {
		username: locals.session.account.username,
		params: extensionAuthParams(parsed.request),
		cancelUrl: cancelRedirect(parsed.request)
	}
}
