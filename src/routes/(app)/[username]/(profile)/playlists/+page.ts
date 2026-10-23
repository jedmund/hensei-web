import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
	const { isOwner } = await parent()
	return { isOwner }
}
