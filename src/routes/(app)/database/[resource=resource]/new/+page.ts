import { requireEditor } from '$lib/auth/requireEditor'
import { loadScreen } from '$lib/features/database/schema/routes'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ params, parent }) => {
	requireEditor(await parent(), `/database/${params.resource}`)
	return { screen: await loadScreen(params.resource, 'new') }
}
