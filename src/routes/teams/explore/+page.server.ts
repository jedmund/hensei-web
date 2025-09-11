import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import * as parties from '$lib/api/resources/parties'

export const load: PageServerLoad = async ({ fetch, url, depends }) => {
  depends('app:parties:list')

  const pageParam = url.searchParams.get('page')
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1

  try {
    const { items, total, totalPages, perPage } = await parties.list(fetch, { page })
    return { items, page, total, totalPages, perPage }
  } catch (e: any) {
    throw error(e?.status || 502, e?.message || 'Failed to load teams')
  }
}

