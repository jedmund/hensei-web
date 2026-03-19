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
  } catch (e: any) {
    throw error(e?.status || 502, e?.message || 'Failed to load profile')
  }
}
