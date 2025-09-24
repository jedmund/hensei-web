import type { PageServerLoad } from './$types'
import { PartyService } from '$lib/services/party.service'

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
	// Get auth data directly from locals instead of parent()
	const authUserId = locals.session?.account?.userId

	// Try to fetch party data on the server
	const partyService = new PartyService(fetch)

	let partyFound = false
	let party = null
	let canEdit = false

	try {
		// Fetch the party
		party = await partyService.getByShortcode(params.id)
		partyFound = true

		// Determine if user can edit
		canEdit = authUserId ? party.user?.id === authUserId : false
	} catch (err) {
		// Error is expected for test/invalid IDs
	}

	// Return party data with explicit serialization
	return {
		party: party ? structuredClone(party) : null,
		canEdit: Boolean(canEdit),
		partyFound,
		authUserId: authUserId || null
	}
}
