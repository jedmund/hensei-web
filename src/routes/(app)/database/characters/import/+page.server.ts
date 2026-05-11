import type { PageServerLoad } from './$types'
import { requireEditor } from '$lib/auth/requireEditor'

export const load: PageServerLoad = async ({ parent }) => {
	const parentData = await parent()
	requireEditor(parentData, '/database/characters')
	return { role: parentData.role }
}
