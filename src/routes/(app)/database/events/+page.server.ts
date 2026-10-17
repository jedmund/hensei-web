import type { PageServerLoad } from './$types'
import { eventAdapter } from '$lib/api/adapters/event.adapter'
import { error, isHttpError, isRedirect } from '@sveltejs/kit'
import { requireEditor } from '$lib/auth/requireEditor'

// Drafts first: synced events wait here for review
export const load: PageServerLoad = async ({ parent, fetch }) => {
	try {
		const parentData = await parent()
		requireEditor(parentData, '/database')
		const events = await eventAdapter.listEvents({ status: 'draft' }, { fetch })
		return { events, role: parentData.role }
	} catch (err) {
		if (isHttpError(err) || isRedirect(err)) throw err
		console.error('Failed to load events:', err)
		throw error(500, 'Failed to load events')
	}
}
