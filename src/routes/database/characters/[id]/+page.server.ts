import type { PageServerLoad } from './$types'
import { entityAdapter } from '$lib/api/adapters'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, parent }) => {
	try {
		// Get parent data to access role
		const parentData = await parent()

		const character = await entityAdapter.getCharacter(params.id)

		if (!character) {
			throw error(404, 'Character not found')
		}

		return {
			character,
			role: parentData.role
		}
	} catch (err) {
		console.error('Failed to load character:', err)

		if (err instanceof Error && 'status' in err && err.status === 404) {
			throw error(404, 'Character not found')
		}

		throw error(500, 'Failed to load character')
	}
}