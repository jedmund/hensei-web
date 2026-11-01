import type { PageServerLoad } from './$types'
import { eventAdapter } from '$lib/api/adapters/event.adapter'
import { error, isHttpError, isRedirect } from '@sveltejs/kit'
import { requireCurator } from '$lib/auth/requireEditor'

export const load: PageServerLoad = async ({ params, parent, fetch }) => {
	try {
		const parentData = await parent()
		requireCurator(parentData, '/database/events')
		const event = await eventAdapter.getEvent(params.id, { fetch })
		return { event, role: parentData.role }
	} catch (err) {
		if (isHttpError(err) || isRedirect(err)) throw err
		const status = (err as { status?: number })?.status
		if (status === 404) throw error(404, 'Event not found')
		console.error('Failed to load event:', err)
		throw error(500, 'Failed to load event')
	}
}
