import type { PageServerLoad } from './$types'
import { entityAdapter } from '$lib/api/adapters/entity.adapter'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, parent }) => {
	try {
		const parentData = await parent()

		const character = await entityAdapter.getCharacter(params.granblueId, { styleSwap: true })

		if (!character) {
			throw error(404, 'Character not found')
		}

		return {
			character,
			role: parentData.role,
			isStyleSwap: true
		}
	} catch (err) {
		console.error('Failed to load style character:', err)

		if (err instanceof Error && 'status' in err && err.status === 404) {
			throw error(404, 'Character not found')
		}

		throw error(500, 'Failed to load character')
	}
}
