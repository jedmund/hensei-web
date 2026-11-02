import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const username = locals.session.account?.username
	if (locals.session.isAuthenticated && username) {
		redirect(302, `/${username}/collection`)
	}
}
