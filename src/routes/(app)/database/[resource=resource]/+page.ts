import { loadScreen, redirectMovedView } from '$lib/features/database/schema/routes'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ params, url }) => {
	redirectMovedView(params.resource, url)
	return { screen: await loadScreen(params.resource, 'list') }
}
