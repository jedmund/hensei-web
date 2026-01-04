import type { PageServerLoad } from './$types'
import { jobAdapter } from '$lib/api/adapters/job.adapter'
import { error, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, parent }) => {
	// Get parent data to access role
	const parentData = await parent()

	// Check if user has editor role
	if (!parentData.role || parentData.role < 7) {
		throw redirect(302, `/database/job-accessories/${params.granblueId}`)
	}

	try {
		const accessory = await jobAdapter.getAccessoryById(params.granblueId)

		if (!accessory) {
			throw error(404, 'Job accessory not found')
		}

		return {
			accessory,
			role: parentData.role
		}
	} catch (err) {
		console.error('Failed to load job accessory:', err)

		if (err instanceof Error && 'status' in err && err.status === 404) {
			throw error(404, 'Job accessory not found')
		}

		throw error(500, 'Failed to load job accessory')
	}
}
