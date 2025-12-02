import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ parent }) => {
	const parentData = await parent()

	// Require editor role (>= 7) to access batch import
	if (!parentData.role || parentData.role < 7) {
		throw redirect(302, '/database/summons')
	}

	return {
		role: parentData.role
	}
}
