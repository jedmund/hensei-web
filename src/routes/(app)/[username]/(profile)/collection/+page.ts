import { redirect } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ params }) => {
	// Redirect to characters as the default collection tab
	throw redirect(307, `/${params.username}/collection/characters`)
}
