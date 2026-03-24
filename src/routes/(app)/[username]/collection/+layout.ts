import type { LayoutLoad } from './$types'
import { error } from '@sveltejs/kit'
import { userAdapter } from '$lib/api/adapters/user.adapter'

export const load: LayoutLoad = async ({ params, parent, fetch }) => {
	const username = params.username
	const { account } = await parent()
	const isOwner = account?.username === username

	try {
		// Get basic user info
		const userInfo = await userAdapter.getInfo(username, { fetch })

		return {
			user: userInfo,
			isOwner
		}
	} catch (e: unknown) {
		const err = e as Record<string, unknown>
		const status = typeof err?.status === 'number' ? err.status : undefined
		const message = typeof err?.message === 'string' ? err.message : undefined
		// 403 means collection is private
		if (status === 403) {
			throw error(403, 'This collection is private')
		}
		throw error(status || 502, message || 'Failed to load user')
	}
}
