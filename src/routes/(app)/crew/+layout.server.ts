import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		isAuthenticated: locals.session.isAuthenticated,
		user: locals.session.user,
		account: locals.session.account
	}
}
