import type { PageLoad } from './$types'
import { error } from '@sveltejs/kit'
import { userAdapter } from '$lib/api/adapters/user.adapter'

export const load: PageLoad = async ({ params, parent, fetch }) => {
	const username = params.username
	const { account } = await parent()
	const isOwner = account?.username === username

	try {
		const { user } = await userAdapter.getProfile(username, 1, { fetch })
		return { user, isOwner }
	} catch (e: unknown) {
		const err = e as Record<string, unknown>
		throw error((typeof err?.status === 'number' ? err.status : undefined) || 502, (typeof err?.message === 'string' ? err.message : undefined) || 'Failed to load profile')
	}
}
