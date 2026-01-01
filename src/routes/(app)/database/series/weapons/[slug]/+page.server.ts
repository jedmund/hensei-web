import type { PageServerLoad } from './$types'
import { entityAdapter } from '$lib/api/adapters/entity.adapter'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, parent }) => {
	const parentData = await parent()

	try {
		const series = await entityAdapter.getWeaponSeries(params.slug)

		if (!series) {
			throw error(404, 'Weapon series not found')
		}

		return {
			series,
			role: parentData.role
		}
	} catch (err) {
		console.error('Failed to load weapon series:', err)

		if (err instanceof Error && 'status' in err && err.status === 404) {
			throw error(404, 'Weapon series not found')
		}

		throw error(500, 'Failed to load weapon series')
	}
}
