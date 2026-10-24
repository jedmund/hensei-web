import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { localizeHref } from '$lib/paraglide/runtime'
import { GALLERY_PATH } from '$lib/utils/browseRoutes'

// All teams now live at the Gallery; keep old links (and their filters) working
export const load: PageServerLoad = async ({ url }) => {
	redirect(302, `${localizeHref(GALLERY_PATH)}${url.search}`)
}
