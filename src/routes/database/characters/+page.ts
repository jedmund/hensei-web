import type { PageLoad } from './$types'
import { searchCharacters } from '$lib/api/resources/search'

export const load: PageLoad = async ({ fetch, url }) => {
  const page = Number(url.searchParams.get('page') || '1') || 1
  const pageSize = Number(url.searchParams.get('pageSize') || '20') || 20

  const search = await searchCharacters({ page, per: pageSize }, undefined, fetch)

  return {
    items: search.results || [],
    page: search.meta?.page || page,
    totalPages: search.meta?.total_pages || 1,
    total: search.meta?.count || 0,
    pageSize: search.meta?.per_page || pageSize
  }
}

