import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent }) => {
	const { user, isOwner } = await parent()

	// User info comes from layout, collection data is fetched client-side via TanStack Query
	// The unified API endpoint handles privacy checks server-side
	return {
		user,
		isOwner
	}
}
