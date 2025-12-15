import type { PageServerLoad } from './$types'
import { entityAdapter } from '$lib/api/adapters/entity.adapter'
import { error, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, parent }) => {
	// Get parent data to access role
	const parentData = await parent()

	// Role check - must be editor level (>= 7) to edit
	if (!parentData.role || parentData.role < 7) {
		throw redirect(303, `/database/summons/${params.granblueId}`)
	}

	try {
		const summon = await entityAdapter.getSummon(params.granblueId)

		if (!summon) {
			throw error(404, 'Summon not found')
		}

		return {
			summon,
			role: parentData.role
		}
	} catch (err) {
		console.error('Failed to load summon:', err)

		if (err instanceof Error && 'status' in err && err.status === 404) {
			throw error(404, 'Summon not found')
		}

		throw error(500, 'Failed to load summon')
	}
}
