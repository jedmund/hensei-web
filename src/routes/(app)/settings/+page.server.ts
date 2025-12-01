import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getAccountFromCookies, getUserFromCookies } from '$lib/auth/cookies'

export const load: PageServerLoad = async ({ cookies, url }) => {
	const account = getAccountFromCookies(cookies)
	const currentUser = getUserFromCookies(cookies)

	// Redirect to login if not authenticated
	if (!account || !currentUser) {
		throw redirect(303, `/auth/login?redirect=${encodeURIComponent(url.pathname)}`)
	}

	return {
		account,
		currentUser
	}
}