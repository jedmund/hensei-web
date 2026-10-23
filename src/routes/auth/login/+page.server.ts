import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import { safeRedirectPath } from '$lib/utils/safeRedirect'
import { isSocialProvider, SOCIAL_PROVIDER_LABELS } from '$lib/auth/socialProviders'
import {
	isSocialErrorCode,
	OPEN_SETTINGS_PARAM,
	SOCIAL_ERROR_PARAM,
	SOCIAL_LINKED_PARAM,
	SOCIAL_PROVIDER_PARAM,
	withParams
} from '$lib/auth/socialResult'
import { enabledProviders, isProviderAvailable } from '$lib/server/socialAuth/clients'
import { getLinkTicket } from '$lib/server/socialAuth/cookies'

export const load: PageServerLoad = async ({ locals, url, cookies }) => {
	if (locals.session.isAuthenticated) {
		redirect(302, safeRedirectPath(url.searchParams.get('next')))
	}

	// Only shown once the provider has proven the email (see the PRD), so this
	// is the one place the page may say that an account exists.
	const pendingLink = getLinkTicket(cookies)
	const socialError = url.searchParams.get(SOCIAL_ERROR_PARAM)

	return {
		socialProviders: enabledProviders().filter(isProviderAvailable),
		linkProvider: pendingLink ? SOCIAL_PROVIDER_LABELS[pendingLink.provider] : null,
		socialError: isSocialErrorCode(socialError) ? socialError : null,
		next: url.searchParams.get('next')
	}
}

export const actions: Actions = {
	default: async ({ request, fetch, url }) => {
		const form = await request.formData()
		const email = String(form.get('email') ?? '')
		const password = String(form.get('password') ?? '')

		if (!email || !password) {
			return fail(400, { error: 'fields_required' as const, email })
		}

		const res = await fetch('/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password, grant_type: 'password' })
		})

		if (res.ok) {
			const next = safeRedirectPath(url.searchParams.get('next'))
			const body = (await res.json().catch(() => ({}))) as Record<string, unknown>

			// A provider was waiting on this login to be linked: show the result
			// in the settings modal.
			if (isSocialProvider(body.linked)) {
				redirect(
					303,
					withParams(next, {
						[OPEN_SETTINGS_PARAM]: 'account',
						[SOCIAL_LINKED_PARAM]: body.linked,
						[SOCIAL_PROVIDER_PARAM]: body.linked
					})
				)
			}
			if (isSocialProvider(body.provider) && isSocialErrorCode(body.error)) {
				redirect(
					303,
					withParams(next, {
						[OPEN_SETTINGS_PARAM]: 'account',
						[SOCIAL_ERROR_PARAM]: body.error,
						[SOCIAL_PROVIDER_PARAM]: body.provider
					})
				)
			}

			redirect(303, next)
		}

		return fail(res.status, { error: 'failed' as const, email })
	}
}
