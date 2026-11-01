import { redirect } from '@sveltejs/kit'
import { isEditor } from '$lib/auth/roles'
import type { PageLoad } from './$types'

// The overview is for editors; curators can only open Events
export const load: PageLoad = async ({ parent }) => {
	const { role } = await parent()
	if (!isEditor(role)) throw redirect(302, '/database/events')
}
