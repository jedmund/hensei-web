import type { PageServerLoad } from './$types'
import { entityAdapter } from '$lib/api/adapters/entity.adapter'
import { error, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, parent }) => {
	const parentData = await parent()

	// Role check - must be editor level (>= 7) to edit
	if (!parentData.role || parentData.role < 7) {
		throw redirect(303, `/database/series/characters/${params.slug}`)
	}

	try {
		const series = await entityAdapter.getCharacterSeries(params.slug)

		if (!series) {
			throw error(404, 'Character series not found')
		}

		return {
			series,
			role: parentData.role
		}
	} catch (err) {
		console.error('Failed to load character series:', err)

		if (err instanceof Error && 'status' in err && err.status === 404) {
			throw error(404, 'Character series not found')
		}

		throw error(500, 'Failed to load character series')
	}
}
