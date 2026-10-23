import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent, params }) => {
	const { role } = await parent()
	return { role, modifier: params.modifier }
}
