import type { LayoutServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { userAdapter } from '$lib/api/adapters/user.adapter'

export const load: LayoutServerLoad = async ({ params, locals, fetch }) => {
	const username = params.username
	const isOwner = locals.session?.account?.username === username

	try {
		// Get basic user info
		const userInfo = await userAdapter.getInfo(username, { fetch })

		return {
			user: userInfo,
			isOwner
		}
	} catch (e: any) {
		// 403 means collection is private
		if (e?.status === 403) {
			throw error(403, 'This collection is private')
		}
		throw error(e?.status || 502, e?.message || 'Failed to load user')
	}
}
