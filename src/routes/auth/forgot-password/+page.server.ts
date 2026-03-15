import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import { getApiBaseUrl } from '$lib/api/adapters/config'

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session.isAuthenticated) {
		redirect(302, '/me')
	}
	return {}
}

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const form = await request.formData()
		const email = String(form.get('email') ?? '')

		if (!email) {
			return fail(400, { error: 'email_required' as const, email })
		}

		// Always return success to the user to avoid leaking account existence
		try {
			await fetch(`${getApiBaseUrl()}/password_resets`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			})
		} catch {
			// Silently ignore errors
		}

		return { success: true }
	}
}
