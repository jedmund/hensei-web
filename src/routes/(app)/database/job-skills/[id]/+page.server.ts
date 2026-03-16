import type { PageServerLoad } from './$types'
import { jobAdapter } from '$lib/api/adapters/job.adapter'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, parent }) => {
	try {
		const parentData = await parent()
		const skill = await jobAdapter.getSkillById(params.id)

		if (!skill) {
			throw error(404, 'Job skill not found')
		}

		return {
			skill,
			role: parentData.role
		}
	} catch (err) {
		console.error('Failed to load job skill:', err)

		if (err instanceof Error && 'status' in err && err.status === 404) {
			throw error(404, 'Job skill not found')
		}

		throw error(500, 'Failed to load job skill')
	}
}
