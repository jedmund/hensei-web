import type { PageLoad } from './$types'
import { searchWeapons } from '$lib/api/resources/search'

export const load: PageLoad = async ({ fetch, url }) => {
  const page = Number(url.searchParams.get('page') || '1') || 1
  const pageSize = Number(url.searchParams.get('pageSize') || '20') || 20

  console.log('[Database Weapons] Loading page:', page, 'pageSize:', pageSize)

  const search = await searchWeapons({ page, per: pageSize }, undefined, fetch)

  console.log('[Database Weapons] API Response:', search)
  console.log('[Database Weapons] Meta:', search.meta)
  console.log('[Database Weapons] Results count:', search.results?.length || 0)

  // Extract data from meta object
  const result = {
    items: search.results || [],
    page: search.meta?.page || page,
    totalPages: search.meta?.total_pages || 1,
    total: search.meta?.count || 0,
    pageSize: search.meta?.per_page || pageSize
  }

  console.log('[Database Weapons] Returning to component:', result)

  return result
}

