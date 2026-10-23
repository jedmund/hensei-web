import type { PageLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const load: PageLoad = async ({ params, parent }) => {
	const username = params.username
	const { isOwner } = await parent()

	// Only the owner can view their favorites
	if (!isOwner) {
		throw redirect(302, `/${username}`)
	}

	return { isOwner }
}
