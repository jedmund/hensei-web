import type { FetchLike, Dict } from '../core'
import { buildUrl, API_BASE } from '../core'

// Custom JSON fetch without credentials for search endpoints to avoid CORS issues
async function searchJson<T>(fetchFn: FetchLike, url: string, body?: unknown): Promise<T> {
  const res = await fetchFn(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.json() as Promise<T>
}

export interface SearchParams {
  query?: string
  locale?: 'en' | 'ja'
  exclude?: string[]
  page?: number
  per?: number
  filters?: {
    element?: number[]
    rarity?: number[]
    proficiency1?: number[]  // For weapons and characters
    proficiency2?: number[]  // For characters only
    series?: number[]
    extra?: boolean
    subaura?: boolean
  }
}

export interface SearchResult {
  id: string
  granblue_id: string
  name: { en?: string; ja?: string }
  element?: number
  rarity?: number
  proficiency?: number
  series?: number
  image_url?: string
  searchable_type: 'Weapon' | 'Character' | 'Summon'
}

export interface SearchResponse {
  results: SearchResult[]
  total?: number
  page?: number
  total_pages?: number
  meta?: {
    count: number
    page: number
    per_page: number
    total_pages: number
  }
}

export function searchAll(
  params: SearchParams,
  init?: RequestInit,
  fetchFn: FetchLike = fetch
): Promise<SearchResponse> {
  const body = {
    query: params.query || '',
    locale: params.locale || 'en',
    page: params.page || 1,
    exclude: params.exclude || [],
    filters: params.filters || {}
  }

  const url = `${API_BASE}/search/all`
  return searchJson(fetchFn, url, body)
}

export function searchWeapons(
  params: SearchParams,
  init?: RequestInit,
  fetchFn: FetchLike = fetch
): Promise<SearchResponse> {
  const body: any = {
    locale: params.locale || 'en',
    page: params.page || 1,
    per: params.per || undefined
  }

  // Only include query if it's provided and not empty
  if (params.query) {
    body.query = params.query
  }

  // Only include filters if they have values
  const filters: any = {}
  if (params.filters?.element?.length) filters.element = params.filters.element
  if (params.filters?.rarity?.length) filters.rarity = params.filters.rarity
  if (params.filters?.proficiency1?.length) filters.proficiency1 = params.filters.proficiency1
  if (params.filters?.extra !== undefined) filters.extra = params.filters.extra

  if (Object.keys(filters).length > 0) {
    body.filters = filters
  }

  const url = `${API_BASE}/search/weapons`
  console.log('[searchWeapons] Making request to:', url)
  console.log('[searchWeapons] Request body:', body)

  return searchJson(fetchFn, url, body).then(response => {
    console.log('[searchWeapons] Response received:', response)
    return response
  })
}

export function searchCharacters(
  params: SearchParams,
  init?: RequestInit,
  fetchFn: FetchLike = fetch
): Promise<SearchResponse> {
  const body: any = {
    locale: params.locale || 'en',
    page: params.page || 1,
    per: params.per || undefined
  }

  // Only include query if it's provided and not empty
  if (params.query) {
    body.query = params.query
  }

  // Only include filters if they have values
  const filters: any = {}
  if (params.filters?.element?.length) filters.element = params.filters.element
  if (params.filters?.rarity?.length) filters.rarity = params.filters.rarity
  if (params.filters?.proficiency1?.length) filters.proficiency1 = params.filters.proficiency1
  if (params.filters?.proficiency2?.length) filters.proficiency2 = params.filters.proficiency2

  if (Object.keys(filters).length > 0) {
    body.filters = filters
  }

  const url = `${API_BASE}/search/characters`
  return searchJson(fetchFn, url, body)
}

export function searchSummons(
  params: SearchParams,
  init?: RequestInit,
  fetchFn: FetchLike = fetch
): Promise<SearchResponse> {
  const body: any = {
    locale: params.locale || 'en',
    page: params.page || 1,
    per: params.per || undefined
  }

  // Only include query if it's provided and not empty
  if (params.query) {
    body.query = params.query
  }

  // Only include filters if they have values
  const filters: any = {}
  if (params.filters?.element?.length) filters.element = params.filters.element
  if (params.filters?.rarity?.length) filters.rarity = params.filters.rarity
  if (params.filters?.subaura !== undefined) filters.subaura = params.filters.subaura

  if (Object.keys(filters).length > 0) {
    body.filters = filters
  }

  const url = `${API_BASE}/search/summons`
  return searchJson(fetchFn, url, body)
}
