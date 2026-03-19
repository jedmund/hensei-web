import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ parent }) => {
	const parentData = await parent()

	if (!parentData.role || parentData.role < 7) {
		throw redirect(302, '/database/bullets')
	}

	return {
		role: parentData.role
	}
}
