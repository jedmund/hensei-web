import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import { dev } from '$app/environment'
import { SOCIAL_PROVIDER_LABELS } from '$lib/auth/socialProviders'
import { SOCIAL_ERROR_PARAM, withParams } from '$lib/auth/socialResult'
import { establishSession } from '$lib/auth/session'
import { signUpWithTicket } from '$lib/server/socialAuth/api'
import { LOGIN_PATH } from '$lib/server/socialAuth/callback'
import { clearSignupTicket, getSignupTicket } from '$lib/server/socialAuth/cookies'

const USERNAME = /^[a-zA-Z0-9_-]{3,26}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const expired = () => withParams(LOGIN_PATH, { [SOCIAL_ERROR_PARAM]: 'expired' })

/**
 * The username step for a new account created with a provider. The signup
 * ticket from POST /auth/:provider waits in an httpOnly cookie.
 */
export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (locals.session.isAuthenticated) redirect(302, '/me')

	const ticket = getSignupTicket(cookies)
	if (!ticket) redirect(302, expired())

	return {
		provider: ticket.provider,
		providerLabel: SOCIAL_PROVIDER_LABELS[ticket.provider],
		suggestedUsername: ticket.suggestedUsername,
		emailRequired: ticket.emailRequired
	}
}

export const actions: Actions = {
	default: async ({ request, cookies, fetch }) => {
		const ticket = getSignupTicket(cookies)
		if (!ticket) redirect(303, expired())

		const form = await request.formData()
		const username = String(form.get('username') ?? '').trim()
		const email = ticket.emailRequired ? String(form.get('email') ?? '').trim() : ''

		if (!USERNAME.test(username) || (ticket.emailRequired && !EMAIL.test(email))) {
			return fail(400, { error: 'invalid' as const, username, email })
		}

		let result: Awaited<ReturnType<typeof signUpWithTicket>>
		try {
			result = await signUpWithTicket(fetch, ticket.ticket, {
				username,
				email: ticket.emailRequired ? email : undefined
			})
		} catch {
			return fail(502, { error: 'failed' as const, username, email })
		}

		switch (result.kind) {
			case 'tokens':
				try {
					await establishSession(cookies, result.tokens, { secure: !dev })
				} catch {
					// The account exists; signing in with the provider again finishes the job.
					clearSignupTicket(cookies)
					redirect(303, withParams(LOGIN_PATH, { [SOCIAL_ERROR_PARAM]: 'failed' }))
				}
				clearSignupTicket(cookies)
				return redirect(303, '/me')
			case 'invalid_ticket':
				clearSignupTicket(cookies)
				return redirect(303, expired())
			case 'validation':
				return fail(422, {
					error: 'validation' as const,
					messages: result.messages,
					username,
					email
				})
			case 'error':
				return fail(result.status === 429 ? 429 : 502, {
					error: result.status === 429 ? ('rate_limited' as const) : ('failed' as const),
					username,
					email
				})
		}
	}
}
