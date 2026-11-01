import { requireEditor } from '$lib/auth/requireEditor'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent }) => {
	requireEditor(await parent(), '/')
}
