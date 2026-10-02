import type { RequestHandler } from './$types'
import { error, redirect } from '@sveltejs/kit'
import { dev } from '$app/environment'
import { isSocialProvider } from '$lib/auth/socialProviders'
import { withParams } from '$lib/auth/socialResult'
import { safeRedirectPath } from '$lib/utils/safeRedirect'
import { createAuthorization, isProviderAvailable } from '$lib/server/socialAuth/clients'
import { setFlowCookies } from '$lib/server/socialAuth/cookies'
import { LOGIN_PATH } from '$lib/server/socialAuth/callback'

/**
 * GET /auth/{provider}: starts a provider sign-in (or, with ?mode=link, links
 * the provider to the logged-in account) and redirects to the provider.
 *
 * The buttons are plain links rather than forms: under the CSP's form-action,
 * Chrome also checks the redirect that follows a form submission, so a form
 * that redirects to the provider would be blocked.
 */
export const GET: RequestHandler = ({ params, url, cookies, locals }) => {
	const provider = params.provider
	if (!isSocialProvider(provider) || !isProviderAvailable(provider)) error(404, 'Not found')

	const mode = url.searchParams.get('mode') === 'link' ? 'link' : 'login'
	const rawNext = url.searchParams.get('next')

	if (mode === 'link' && !locals.session.isAuthenticated) {
		redirect(302, withParams(LOGIN_PATH, { next: safeRedirectPath(rawNext, '/') }))
	}
	if (mode === 'login' && locals.session.isAuthenticated) {
		redirect(302, safeRedirectPath(rawNext))
	}

	const auth = createAuthorization(provider, url.origin)
	setFlowCookies(
		cookies,
		provider,
		{
			state: auth.state,
			codeVerifier: auth.codeVerifier,
			nonce: auth.nonce,
			mode,
			next: rawNext ? safeRedirectPath(rawNext, mode === 'link' ? '/' : '/me') : null
		},
		{ secure: !dev }
	)

	redirect(302, auth.url.toString())
}
