import type { PageLoad } from './$types'
import { error } from '@sveltejs/kit'
import { playlistAdapter } from '$lib/api/adapters/playlist.adapter'

export const load: PageLoad = async ({ params, parent, fetch }) => {
	const { username, slug } = params
	const { account } = await parent()
	const isOwner = account?.username === username

	try {
		const playlist = await playlistAdapter.get(username, slug, { fetch })
		return { playlist, username, isOwner }
	} catch (e: unknown) {
		const err = e as Record<string, unknown>
		throw error(
			(typeof err?.status === 'number' ? err.status : undefined) || 404,
			(typeof err?.message === 'string' ? err.message : undefined) || 'Playlist not found'
		)
	}
}
