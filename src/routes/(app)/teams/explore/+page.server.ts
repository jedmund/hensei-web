import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { localizeHref } from '$lib/paraglide/runtime'

// Explore now lives at `/`; keep old links (and their filters) working
export const load: PageServerLoad = async ({ url }) => {
	redirect(302, `${localizeHref('/')}${url.search}`)
}
