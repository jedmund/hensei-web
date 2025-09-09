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

	return {
		isAuthenticated,
		account,
		currentUser
	}
}
