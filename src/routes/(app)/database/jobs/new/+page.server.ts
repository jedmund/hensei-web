import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ parent }) => {
	// Get parent data to access role
	const parentData = await parent()

	// Check if user has editor role
	if (!parentData.role || parentData.role < 7) {
		throw redirect(302, '/database/jobs')
	}

	return {
		role: parentData.role
	}
}
