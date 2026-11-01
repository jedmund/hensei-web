import { loadScreen } from '$lib/features/database/schema/routes'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ params, data }) => ({
	...data,
	screen: await loadScreen(params.resource, 'list')
})
