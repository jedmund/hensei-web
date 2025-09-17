import type { PageServerLoad } from './$types'
import { get } from '$lib/api/core'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		const summon = await get(fetch, `/summons/${params.id}`)

		if (!summon) {
			throw error(404, 'Summon not found')
		}

		return {
			summon
		}
	} catch (err) {
		console.error('Failed to load summon:', err)

		if (err instanceof Error && 'status' in err && err.status === 404) {
			throw error(404, 'Summon not found')
		}

		throw error(500, 'Failed to load summon')
	}
}