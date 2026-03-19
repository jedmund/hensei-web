import type { PageLoad } from './$types'
import { partyAdapter } from '$lib/api/adapters/party.adapter'

export const load: PageLoad = async ({ params, parent, fetch }) => {
	const { account } = await parent()
	const authUserId = account?.userId ?? null

	let partyFound = false
	let party = null
	let canEdit = false

	try {
		// Fetch the party using adapter (SvelteKit's fetch injects auth via handleFetch)
		party = await partyAdapter.getByShortcode(params.id, { fetch })
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
