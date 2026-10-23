import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import { safeRedirectPath } from '$lib/utils/safeRedirect'
import { enabledProviders, isProviderAvailable } from '$lib/server/socialAuth/clients'

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.session.isAuthenticated) {
		redirect(302, safeRedirectPath(url.searchParams.get('next')))
	}
	return {
		socialProviders: enabledProviders().filter(isProviderAvailable),
		next: url.searchParams.get('next')
	}
}

export const actions: Actions = {
	default: async ({ request, fetch, url }) => {
		const form = await request.formData()
		const username = String(form.get('username') ?? '')
		const email = String(form.get('email') ?? '')
		const password = String(form.get('password') ?? '')
		const password_confirmation = String(form.get('password_confirmation') ?? '')

		// Basic validation
		if (!username || !email || !password || !password_confirmation) {
			return fail(400, {
				error: 'fields_required' as const,
				username,
				email
			})
		}

		if (password !== password_confirmation) {
			return fail(400, {
				error: 'password_mismatch' as const,
				username,
				email
			})
		}

		const res = await fetch('/auth/signup', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, email, password, password_confirmation })
		})

		if (res.ok) {
			redirect(303, safeRedirectPath(url.searchParams.get('next')))
		}

		const j = await res.json().catch(() => ({}))
		return fail(Math.min(res.status, 499), {
			error: 'failed' as const,
			details: j.messages ?? j.details,
			username,
			email
		})
	}
}
