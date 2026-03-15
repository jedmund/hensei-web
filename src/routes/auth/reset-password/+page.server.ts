import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import { getApiBaseUrl } from '$lib/api/adapters/config'

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.session.isAuthenticated) {
		redirect(302, '/me')
	}

	const email = url.searchParams.get('email') ?? ''
	const token = url.searchParams.get('token') ?? ''

	if (!email || !token) {
		return { invalidToken: true }
	}

	return { email, token }
}

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const form = await request.formData()
		const email = String(form.get('email') ?? '')
		const token = String(form.get('token') ?? '')
		const password = String(form.get('password') ?? '')
		const password_confirmation = String(form.get('password_confirmation') ?? '')

		if (!email || !token) {
			return fail(400, { invalidToken: true })
		}

		if (!password || !password_confirmation) {
			return fail(400, { error: 'fields_required' as const })
		}

		if (password.length < 8) {
			return fail(400, { error: 'password_min' as const })
		}

		if (password !== password_confirmation) {
			return fail(400, { error: 'password_mismatch' as const })
		}

		const res = await fetch(`${getApiBaseUrl()}/password_resets`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, token, password, password_confirmation })
		})

		if (res.ok) {
			return { success: true }
		}

		const j = await res.json().catch(() => ({}))

		if (res.status === 400) {
			return fail(400, { invalidToken: true })
		}

		return fail(res.status, { error: 'failed' as const })
	}
}
