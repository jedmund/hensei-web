import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { playlistAdapter } from '$lib/api/adapters/playlist.adapter'

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  const { username, slug } = params
  const isOwner = locals.session?.account?.username === username

  try {
    const playlist = await playlistAdapter.get(username, slug, { fetch })
    return { playlist, username, isOwner }
  } catch (e: any) {
    throw error(e?.status || 404, e?.message || 'Playlist not found')
  }
}
