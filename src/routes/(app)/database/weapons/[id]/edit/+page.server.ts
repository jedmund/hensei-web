import type { PageServerLoad } from './$types'
import { entityAdapter } from '$lib/api/adapters/entity.adapter'
import { error, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, parent }) => {
	// Get parent data to access role
	const parentData = await parent()

	// Role check - must be editor level (>= 7) to edit
	if (!parentData.role || parentData.role < 7) {
		throw redirect(303, `/database/weapons/${params.id}`)
	}

	try {
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
