import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ parent }) => {
	const { isAuthenticated, account, currentUser } = await parent()

	if (!isAuthenticated) {
		throw redirect(302, '/login?next=/me')
	}

	return {
		account,
		user: currentUser
	}
}
