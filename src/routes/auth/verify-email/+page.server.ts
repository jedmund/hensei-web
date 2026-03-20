import type { PageServerLoad } from './$types'
import { getApiBaseUrl } from '$lib/api/adapters/config'

export const load: PageServerLoad = async ({ url, fetch }) => {
	const email = url.searchParams.get('email') ?? ''
	const token = url.searchParams.get('token') ?? ''

	if (!email || !token) {
		return { invalidToken: true }
	}

	const res = await fetch(`${getApiBaseUrl()}/email_verifications`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, token })
	})

	if (res.ok) {
		return { success: true }
	}

	return { invalidToken: true }
}
