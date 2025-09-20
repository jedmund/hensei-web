import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { userAdapter } from '$lib/api/adapters'
import { parseParty } from '$lib/api/schemas/party'

export const load: PageServerLoad = async ({ params, url, depends, locals }) => {
  depends('app:profile')
  const username = params.username
  const pageParam = url.searchParams.get('page')
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1
  const tab = url.searchParams.get('tab') === 'favorites' ? 'favorites' : 'teams'
  const isOwner = locals.session?.account?.username === username

  try {
    if (tab === 'favorites' && isOwner) {
      const fav = await userAdapter.getFavorites({ page })
      return {
        user: { username } as any,
        items: fav.items,
        page: fav.page,
        total: fav.total,
        totalPages: fav.totalPages,
        perPage: fav.perPage,
        tab,
        isOwner
      }
    }

    const { user, items, total, totalPages, perPage } = await userAdapter.getProfile(username, page)
    const parties = items.map((p) => parseParty(p))
    return { user, items: parties, page, total, totalPages, perPage, tab, isOwner }
  } catch (e: any) {
    throw error(e?.status || 502, e?.message || 'Failed to load profile')
  }
}
