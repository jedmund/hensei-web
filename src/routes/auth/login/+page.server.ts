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
			redirect(303, url.searchParams.get('next') ?? '/me')
		}

		const j = await res.json().catch(() => ({}))
		return fail(res.status, { error: 'failed' as const, email })
	}
}
