import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { localizeHref } from '$lib/paraglide/runtime'
import { loadHome } from '$lib/server/home'
import { GALLERY_PATH, HOME_LAUNCHED } from '$lib/utils/browseRoutes'

// Home once it's launched; the Gallery until then
export const load: PageServerLoad = async ({ fetch }) => {
	if (!HOME_LAUNCHED) redirect(302, localizeHref(GALLERY_PATH))
	return loadHome(fetch)
}
