import type { RequestHandler } from './$types'
import { error, redirect } from '@sveltejs/kit'
import { dev } from '$app/environment'
import { isSocialProvider } from '$lib/auth/socialProviders'
import { establishSession } from '$lib/auth/session'
import { exchangeCode, isProviderAvailable } from '$lib/server/socialAuth/clients'
import { setAppleCallbackCookie, takeAppleCallbackCookie } from '$lib/server/socialAuth/cookies'
import { handleSocialCallback, type CallbackParams } from '$lib/server/socialAuth/callback'

/**
 * GET /auth/{provider}/callback: where the provider sends the user back.
 * Discord and Google redirect here with the code in the query. Apple POSTs
 * (see below) and is then redirected here.
 */
export const GET: RequestHandler = async ({ params, url, cookies, fetch, locals }) => {
	const provider = params.provider
	if (!isSocialProvider(provider) || !isProviderAvailable(provider)) error(404, 'Not found')

	let callbackParams: CallbackParams
	if (provider === 'apple') {
		callbackParams = takeAppleCallbackCookie(cookies) ?? {
			code: null,
			state: null,
			error: null,
			user: null
		}
	} else {
		callbackParams = {
			code: url.searchParams.get('code'),
			state: url.searchParams.get('state'),
			error: url.searchParams.get('error'),
			user: null
		}
	}

	const location = await handleSocialCallback(
		{
			provider,
			origin: url.origin,
			params: callbackParams,
			cookies,
			fetch,
			sessionToken: locals.session.account?.token ?? null,
			secure: !dev
		},
		{ exchangeCode, establishSession }
	)

	redirect(303, location)
}

/**
 * POST /auth/apple/callback: Apple's response_mode=form_post callback.
 *
 * This POST is cross-site, so hooks.server.ts exempts this one route from the
 * CSRF origin check; `state` protects it instead. Lax session cookies aren't
 * sent with a cross-site POST, so instead of handling it here, park the params
 * in a short-lived cookie and continue with a same-site GET, which does carry
 * the session (needed when linking from settings).
 */
export const POST: RequestHandler = async ({ params, request, url, cookies }) => {
	if (params.provider !== 'apple' || !isProviderAvailable('apple')) {
		return new Response(null, { status: 405, headers: { Allow: 'GET' } })
	}

	const form = await request.formData().catch(() => null)
	const field = (name: string) => {
		const value = form?.get(name)
		return typeof value === 'string' ? value : null
	}

	setAppleCallbackCookie(cookies, {
		code: field('code'),
		state: field('state'),
		error: field('error'),
		user: field('user')
	})

	redirect(303, url.pathname)
}
