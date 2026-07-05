import type { PageServerLoad } from './$types'

// The database layout already gates on role >= 7; pass role through for edit affordances.
export const load: PageServerLoad = async ({ parent }) => {
	const { role } = await parent()
	return { role }
}
