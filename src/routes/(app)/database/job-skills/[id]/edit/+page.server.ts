import type { PageServerLoad } from './$types'
import { jobAdapter } from '$lib/api/adapters/job.adapter'
import { error } from '@sveltejs/kit'
import { requireEditor } from '$lib/auth/requireEditor'

export const load: PageServerLoad = async ({ params, parent }) => {
	const parentData = await parent()
	requireEditor(parentData, `/database/job-skills/${params.id}`)

	try {
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
