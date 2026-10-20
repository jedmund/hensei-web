import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { localizeHref } from '$lib/paraglide/runtime'
import { loadHome } from '$lib/server/home'
import { HOME_LAUNCHED, HOME_PATH } from '$lib/utils/browseRoutes'

// Home before it's launched, unlinked; once launched it lives at `/`
export const load: PageServerLoad = async ({ fetch, url }) => {
	if (HOME_LAUNCHED) redirect(302, `${localizeHref(HOME_PATH)}${url.search}`)
	return loadHome(fetch)
}
