import type { PageServerLoad } from './$types'
import { eventAdapter } from '$lib/api/adapters/event.adapter'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, parent }) => {
	const parentData = await parent()

	try {
		const event = await eventAdapter.getEvent(params.id)

		if (!event) {
			throw error(404, 'Event not found')
		}

		return {
			event,
			role: parentData.role
		}
	} catch (err) {
		console.error('Failed to load event:', err)

		if (err instanceof Error && 'status' in err && err.status === 404) {
			throw error(404, 'Event not found')
		}

		throw error(500, 'Failed to load event')
	}
}
