import type { PageServerLoad } from './$types'
import { error, redirect } from '@sveltejs/kit'
import { userAdapter } from '$lib/api/adapters/user.adapter'

export const load: PageServerLoad = async ({ params, locals }) => {
  const username = params.username
  const isOwner = locals.session?.account?.username === username

  // Only the owner can view their favorites
  if (!isOwner) {
    throw redirect(302, `/${username}`)
  }

  try {
    // Just get the user info - favorites are fetched client-side
    const { user } = await userAdapter.getProfile(username, 1)
    return { user, isOwner }
  } catch (e: any) {
    throw error(e?.status || 502, e?.message || 'Failed to load profile')
  }
}
