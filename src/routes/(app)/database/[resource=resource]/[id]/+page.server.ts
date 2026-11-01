import { loadRecord } from '$lib/features/database/schema/routes'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, fetch }) =>
	loadRecord(params.resource, params.id, fetch)
