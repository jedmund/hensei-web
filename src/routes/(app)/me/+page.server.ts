import type { PageServerLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals, url }) => {
	const username = locals.session?.account?.username
	if (!username) throw redirect(302, '/auth/login')
	// Keep the query so params like ?settings=account survive the hop
	throw redirect(302, `/${encodeURIComponent(username)}${url.search}`)
}
