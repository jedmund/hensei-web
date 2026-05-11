import type { PageServerLoad } from './$types'
import { entityAdapter } from '$lib/api/adapters/entity.adapter'
import { error } from '@sveltejs/kit'
import { requireEditor } from '$lib/auth/requireEditor'

export const load: PageServerLoad = async ({ params, parent }) => {
	const parentData = await parent()
	requireEditor(parentData, `/database/summons/${params.granblueId}`)

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
