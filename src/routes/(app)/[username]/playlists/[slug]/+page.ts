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
  } catch (e: any) {
    throw error(e?.status || 404, e?.message || 'Playlist not found')
  }
}
