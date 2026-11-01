import { loadScreen } from '$lib/features/database/schema/routes'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ params, data }) => ({
	...data,
	resource: params.resource,
	screen: await loadScreen(params.resource, 'edit')
})
