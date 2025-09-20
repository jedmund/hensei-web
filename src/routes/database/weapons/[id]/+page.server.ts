import type { PageServerLoad } from './$types'
import { entityAdapter } from '$lib/api/adapters'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, parent }) => {
	try {
		// Get parent data to access role
		const parentData = await parent()

		const weapon = await entityAdapter.getWeapon(params.id)

		if (!weapon) {
			throw error(404, 'Weapon not found')
		}

		return {
			weapon,
			role: parentData.role
		}
	} catch (err) {
		console.error('Failed to load weapon:', err)

		if (err instanceof Error && 'status' in err && err.status === 404) {
			throw error(404, 'Weapon not found')
		}

		throw error(500, 'Failed to load weapon')
	}
}