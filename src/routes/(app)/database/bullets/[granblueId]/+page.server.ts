import type { PageServerLoad } from './$types'
import { entityAdapter } from '$lib/api/adapters/entity.adapter'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, parent }) => {
	try {
		const parentData = await parent()

		const bullet = await entityAdapter.getBulletById(params.granblueId)

		if (!bullet) {
			throw error(404, 'Bullet not found')
		}

		return {
			bullet,
			role: parentData.role
		}
	} catch (err) {
		console.error('Failed to load bullet:', err)

		if (err instanceof Error && 'status' in err && err.status === 404) {
			throw error(404, 'Bullet not found')
		}

		throw error(500, 'Failed to load bullet')
	}
}
