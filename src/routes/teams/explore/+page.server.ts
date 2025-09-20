import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { partyAdapter } from '$lib/api/adapters'

export const load: PageServerLoad = async ({ url, depends }) => {
  depends('app:parties:list')

  const pageParam = url.searchParams.get('page')
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1

  console.log('[explore/+page.server.ts] Loading explore page with page:', page)
  console.log('[explore/+page.server.ts] Full URL:', url.toString())

  try {
    const response = await partyAdapter.list({ page })
    console.log('[explore/+page.server.ts] Successfully loaded', response.results.length, 'parties')

    return {
      items: response.results,
      page,
      total: response.total,
      totalPages: response.totalPages,
      perPage: response.per || 20
    }
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

