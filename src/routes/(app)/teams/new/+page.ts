import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
	const parentData = await parent()

	return {
		isAuthenticated: parentData.isAuthenticated ?? false,
		currentUser: parentData.currentUser ?? null
	}
}
