import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.session.isAuthenticated) {
		redirect(302, url.searchParams.get('next') ?? '/me')
	}
	return {}
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
				error: 'All fields are required',
				username,
				email
			})
		}

		if (password !== password_confirmation) {
			return fail(400, {
				error: "Passwords don't match",
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
			redirect(303, url.searchParams.get('next') ?? '/me')
		}

		const j = await res.json().catch(() => ({}))
		return fail(res.status, {
			error: j.error ?? 'Registration failed',
			details: j.details,
			username,
			email
		})
	}
}
