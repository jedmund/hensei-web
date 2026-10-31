import type { PageServerLoad } from './$types'
import { eventAdapter } from '$lib/api/adapters/event.adapter'
import { error, isHttpError, isRedirect } from '@sveltejs/kit'
import { requireCurator } from '$lib/auth/requireEditor'
import { isEditor } from '$lib/auth/roles'
import type { EventStatus } from '$lib/types/api/event'

// Editors start on drafts: synced events wait there for review. Curators
// don't review events, so they start on all of them.
export const load: PageServerLoad = async ({ parent, fetch }) => {
	try {
		const parentData = await parent()
		requireCurator(parentData, '/database')
		const status: EventStatus | 'all' = isEditor(parentData.role) ? 'draft' : 'all'
		const events = await eventAdapter.listEvents({ status }, { fetch })
		return { events, status, role: parentData.role }
	} catch (err) {
		if (isHttpError(err) || isRedirect(err)) throw err
		console.error('Failed to load events:', err)
		throw error(500, 'Failed to load events')
	}
}
