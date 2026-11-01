import type { PageServerLoad } from './$types'
import { eventAdapter } from '$lib/api/adapters/event.adapter'
import { error, isHttpError, isRedirect } from '@sveltejs/kit'
import { requireCurator } from '$lib/auth/requireEditor'

// Every event; statuses aren't shown in the Database
export const load: PageServerLoad = async ({ parent, fetch }) => {
	try {
		const parentData = await parent()
		requireCurator(parentData, '/database')
		const events = await eventAdapter.listEvents({ status: 'all' }, { fetch })
		return { events, role: parentData.role }
	} catch (err) {
		if (isHttpError(err) || isRedirect(err)) throw err
		console.error('Failed to load events:', err)
		throw error(500, 'Failed to load events')
	}
}
