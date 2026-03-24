import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const account = locals.session.account
		? {
				userId: locals.session.account.userId,
				username: locals.session.account.username,
				role: locals.session.account.role
			}
		: null

	const currentUser = locals.session.user ?? null
	const isAuthenticated = locals.session.isAuthenticated

	// For unauthenticated users, read the standalone theme cookie as fallback
	const themePreference = currentUser?.theme ?? cookies.get('theme') ?? null

	return {
		isAuthenticated,
		account,
		currentUser,
		themePreference,
		auth: locals.auth
	}
}
