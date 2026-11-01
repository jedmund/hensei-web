import { redirect } from '@sveltejs/kit'
import { requireEditor } from '$lib/auth/requireEditor'
import { movedView } from '$lib/features/database/sections'
import { localizeHref } from '$lib/paraglide/runtime'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, parent, url }) => {
	// A tab of this list that became a resource of its own (e.g. jobs?view=skills)
	const moved = movedView(params.resource, url.searchParams.get('view'))
	if (moved) redirect(301, localizeHref(moved.path))
	requireEditor(await parent(), '/')
}
