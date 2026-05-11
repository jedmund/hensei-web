import type { PageServerLoad } from './$types'
import { entityAdapter } from '$lib/api/adapters/entity.adapter'
import { error } from '@sveltejs/kit'
import { requireEditor } from '$lib/auth/requireEditor'

export const load: PageServerLoad = async ({ params, parent }) => {
	const parentData = await parent()
	requireEditor(parentData, `/database/weapons/${params.granblueId}`)

	try {
		const weapon = await entityAdapter.getWeapon(params.granblueId)

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
