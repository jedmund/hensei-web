import type { PageServerLoad } from './$types'
import { partyAdapter } from '$lib/api/adapters/party.adapter'

export const load: PageServerLoad = async ({ params, locals }) => {
	const authUserId = locals.session?.account?.userId
	const authToken = locals.session?.account?.token

	let partyFound = false
	let party = null
	let canEdit = false

	try {
		// Fetch the party using adapter (pass auth token for collection data)
		party = await partyAdapter.getByShortcode(params.id, authToken
			? { headers: { Authorization: `Bearer ${authToken}` } }
			: undefined
		)
		partyFound = true

		// Determine if user can edit
		canEdit = authUserId ? party.user?.id === authUserId : false
	} catch (err) {
		// Error is expected for test/invalid IDs
	}

	return {
		party: party ? structuredClone(party) : null,
		canEdit: Boolean(canEdit),
		partyFound,
		authUserId: authUserId || null,
		tab: params.tab || null
	}
}
