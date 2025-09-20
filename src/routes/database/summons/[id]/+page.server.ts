import type { PageServerLoad } from './$types'
import { entityAdapter } from '$lib/api/adapters'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, parent }) => {
	try {
		// Get parent data to access role
		const parentData = await parent()

		const summon = await entityAdapter.getSummon(params.id)

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