import { loadRecord } from '$lib/features/database/schema/routes'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => loadRecord(params.resource, params.id)
