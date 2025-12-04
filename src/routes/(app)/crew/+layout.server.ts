import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Check authentication first
	if (!locals.session.isAuthenticated) {
		throw redirect(302, '/auth/login')
	}

	return {
		user: locals.session.user,
		account: locals.session.account
	}
}
