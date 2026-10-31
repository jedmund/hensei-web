import type { PageServerLoad } from './$types'
import { bulletAdapter } from '$lib/api/adapters/bullet.adapter'
import { error } from '@sveltejs/kit'
import { requireEditor } from '$lib/auth/requireEditor'

export const load: PageServerLoad = async ({ params, parent }) => {
	const parentData = await parent()
	requireEditor(parentData, `/database/bullets/${params.granblueId}`)

	try {
		const bullet = await bulletAdapter.getBulletById(params.granblueId)

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
