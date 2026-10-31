import type { PageServerLoad } from './$types'
import { seriesAdapter } from '$lib/api/adapters/series.adapter'
import { error } from '@sveltejs/kit'
import { requireEditor } from '$lib/auth/requireEditor'

export const load: PageServerLoad = async ({ params, parent }) => {
	const parentData = await parent()
	requireEditor(parentData, `/database/series/characters/${params.slug}`)

	try {
		const series = await seriesAdapter.getCharacterSeries(params.slug)

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
