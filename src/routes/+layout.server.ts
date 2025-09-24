import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
	const account = locals.session.account
		? {
				userId: locals.session.account.userId,
				username: locals.session.account.username,
				role: locals.session.account.role
			}
		: null

	const currentUser = locals.session.user ?? null
	const isAuthenticated = locals.session.isAuthenticated

	// Debug logging for auth data
	if (locals.auth) {
		console.log('[+layout.server] Auth data being passed to client:', {
			hasToken: !!locals.auth.accessToken,
			hasUser: !!locals.auth.user,
			hasExpiresAt: !!locals.auth.expiresAt
		})
	}

	return {
		isAuthenticated,
		account,
		currentUser,
		// Pass auth data for client-side store initialization
		auth: locals.auth
	}
}
