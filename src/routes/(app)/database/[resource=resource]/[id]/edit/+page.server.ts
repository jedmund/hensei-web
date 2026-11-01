import { requireEditor } from '$lib/auth/requireEditor'
import { loadRecord } from '$lib/features/database/schema/routes'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, parent }) => {
	requireEditor(await parent(), `/database/${params.resource}/${params.id}`)
	return loadRecord(params.resource, params.id)
}
