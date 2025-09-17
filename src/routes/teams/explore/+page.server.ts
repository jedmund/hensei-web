import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import * as parties from '$lib/api/resources/parties'

export const load: PageServerLoad = async ({ fetch, url, depends }) => {
  depends('app:parties:list')

  const pageParam = url.searchParams.get('page')
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1

  console.log('[explore/+page.server.ts] Loading explore page with page:', page)
  console.log('[explore/+page.server.ts] Full URL:', url.toString())

  try {
    const { items, total, totalPages, perPage } = await parties.list(fetch, { page })
    console.log('[explore/+page.server.ts] Successfully loaded', items.length, 'parties')
    return { items, page, total, totalPages, perPage }
  } catch (e: any) {
    console.error('[explore/+page.server.ts] Failed to load teams:', {
      error: e,
      message: e?.message,
      status: e?.status,
      stack: e?.stack,
      details: e?.details
    })
    const errorMessage = `Failed to load teams: ${e?.message || 'Unknown error'}. Status: ${e?.status || 'unknown'}`
    throw error(e?.status || 502, errorMessage)
  }
}

