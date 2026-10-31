import { redirect } from '@sveltejs/kit'
import { isEditor } from '$lib/auth/roles'
import type { PageLoad } from './$types'

// Curators can only open Events
export const load: PageLoad = async ({ parent }) => {
	const { role } = await parent()
	throw redirect(302, isEditor(role) ? '/database/weapons' : '/database/events')
}
