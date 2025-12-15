import type { PageServerLoad } from './$types'
import { jobAdapter } from '$lib/api/adapters/job.adapter'
import { error, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, parent }) => {
	// Get parent data to access role
	const parentData = await parent()

	// Role check - must be editor level (>= 7) to edit
	if (!parentData.role || parentData.role < 7) {
		throw redirect(303, `/database/jobs/${params.granblueId}`)
	}

	try {
		const job = await jobAdapter.getById(params.granblueId)

		if (!job) {
			throw error(404, 'Job not found')
		}

		return {
			job,
			role: parentData.role
		}
	} catch (err) {
		console.error('Failed to load job:', err)

		if (err instanceof Error && 'status' in err && err.status === 404) {
			throw error(404, 'Job not found')
		}

		throw error(500, 'Failed to load job')
	}
}
