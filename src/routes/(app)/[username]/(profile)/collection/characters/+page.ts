import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
	const { user, isOwner } = await parent()

	// User info comes from layout, collection data is fetched client-side via TanStack Query
	// The unified API endpoint handles privacy checks server-side
	return {
		user,
		isOwner
	}
}
