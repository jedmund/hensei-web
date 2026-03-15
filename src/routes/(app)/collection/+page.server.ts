import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session.isAuthenticated && locals.session.user?.username) {
		redirect(302, `/${locals.session.user.username}/collection`)
	}
}
