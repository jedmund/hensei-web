import type { PageServerLoad } from './$types'
import { entityAdapter } from '$lib/api/adapters/entity.adapter'
import { error, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, parent }) => {
	const parentData = await parent()

	if (!parentData.role || parentData.role < 7) {
		throw redirect(303, `/database/characters/${params.granblueId}/style`)
	}

	try {
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
