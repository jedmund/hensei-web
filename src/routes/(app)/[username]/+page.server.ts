import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { userAdapter } from '$lib/api/adapters/user.adapter'
import { parseParty } from '$lib/api/schemas/party'

export const load: PageServerLoad = async ({ params, url, depends, locals, fetch }) => {
  depends('app:profile')
  const username = params.username
  const pageParam = url.searchParams.get('page')
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1
  const isOwner = locals.session?.account?.username === username

  try {
    const { user, items, total, totalPages, perPage } = await userAdapter.getProfile(username, page, { fetch })
    const parties = items.map((p) => parseParty(p))
    return { user, items: parties, page, total, totalPages, perPage, isOwner }
  } catch (e: any) {
    throw error(e?.status || 502, e?.message || 'Failed to load profile')
  }
}
