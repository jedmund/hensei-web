import { buildUrl, get, post, put, del, type FetchLike } from '$lib/api/core'
import { parseParty, type Party } from '$lib/api/schemas/party'
import { camelToSnake } from '$lib/api/schemas/transforms'
import { z } from 'zod'

/**
 * Party API resource functions
 */

// Response schemas
// Note: The API returns snake_case; we validate with raw schemas and
// convert to camelCase via parseParty() at the edge.
const PartyResponseSchema = z.object({
  party: z.any() // We'll validate after extracting
})

const PartiesResponseSchema = z.object({
  parties: z.array(z.any()),
  total: z.number().optional()
})

const ConflictResponseSchema = z.object({
  conflicts: z.array(z.string()),
  incoming: z.string(),
  position: z.number()
})

const PaginatedPartiesSchema = z.object({
  results: z.array(z.any()),
  meta: z
    .object({
      count: z.number().optional(),
      total_pages: z.number().optional(),
      per_page: z.number().optional()
    })
    .optional()
})

// API functions
export async function getByShortcode(fetch: FetchLike, shortcode: string): Promise<Party> {
  const url = buildUrl(`/parties/${encodeURIComponent(shortcode)}`)
  const res = await fetch(url, { credentials: 'include' })
  
  if (!res.ok) {
    const error = await parseError(res)
    throw error
  }
  
  const json = await res.json()
  // Extract the party object (API returns { party: {...} })
  const partyData = json?.party || json
  
  // Validate and transform snake_case to camelCase
  const parsed = parseParty(partyData)
  return parsed
}

export async function create(
  fetch: FetchLike,
  payload: Partial<Party>,
  headers?: Record<string, string>
): Promise<Party> {
  const body = camelToSnake(payload)
  const res = await fetch(buildUrl('/parties'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })
  
  if (!res.ok) {
    const error = await parseError(res)
    throw error
  }
  
  const json = await res.json()
  const parsed = PartyResponseSchema.parse(json)
  return parseParty(parsed.party)
}

export async function list(
  fetch: FetchLike,
  params?: { page?: number }
): Promise<{ items: Party[]; total?: number; totalPages?: number; perPage?: number; page: number }> {
  const page = params?.page && params.page > 0 ? params.page : 1
  const url = buildUrl('/parties', { page })
  const res = await fetch(url, { credentials: 'include' })

  if (!res.ok) {
    const error = await parseError(res)
    throw error
  }

  const json = await res.json()
  // Controller returns { results: [...], meta: { count, total_pages, per_page } }
  const parsed = PaginatedPartiesSchema.parse(json)
  const items = (parsed.results || []).map(parseParty)
  return {
    items,
    total: parsed.meta?.count,
    totalPages: parsed.meta?.total_pages,
    perPage: parsed.meta?.per_page,
    page
  }
}

export async function favorites(
  fetch: FetchLike,
  params?: { page?: number }
): Promise<{ items: Party[]; total?: number; totalPages?: number; perPage?: number; page: number }> {
  const page = params?.page && params.page > 0 ? params.page : 1
  const url = buildUrl('/parties/favorites', { page })
  const res = await fetch(url, { credentials: 'include' })

  if (!res.ok) {
    const error = await parseError(res)
    throw error
  }

  const json = await res.json()
  const parsed = PaginatedPartiesSchema.parse(json)
  const items = (parsed.results || []).map(parseParty)
  return {
    items,
    total: parsed.meta?.count,
    totalPages: parsed.meta?.total_pages,
    perPage: parsed.meta?.per_page,
    page
  }
}

export async function update(
  fetch: FetchLike,
  id: string,
  payload: Partial<Party>,
  headers?: Record<string, string>
): Promise<Party> {
  const body = camelToSnake(payload)
  const res = await fetch(buildUrl(`/parties/${id}`), {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })
  
  if (!res.ok) {
    const error = await parseError(res)
    throw error
  }
  
  const json = await res.json()
  
  // Handle conflict response
  if ('conflicts' in json) {
    const conflict = ConflictResponseSchema.parse(json)
    throw {
      type: 'conflict',
      ...conflict
    }
  }
  
  const parsed = PartyResponseSchema.parse(json)
  return parseParty(parsed.party)
}

export async function remix(
  fetch: FetchLike,
  shortcode: string,
  localId?: string,
  headers?: Record<string, string>
): Promise<{ party: Party; editKey?: string }> {
  const body = localId ? { local_id: localId } : {}
  const res = await fetch(buildUrl(`/parties/${encodeURIComponent(shortcode)}/remix`), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })
  
  if (!res.ok) {
    const error = await parseError(res)
    throw error
  }
  
  const json = await res.json()
  const parsed = PartyResponseSchema.parse(json)
  
  // Check for edit_key in response
  const editKey = (json as any).edit_key
  
  return {
    party: parseParty(parsed.party),
    editKey
  }
}

export async function favorite(
  fetch: FetchLike,
  id: string,
  headers?: Record<string, string>
): Promise<void> {
  const res = await fetch(buildUrl(`/parties/${id}/favorite`), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  })
  
  if (!res.ok) {
    const error = await parseError(res)
    throw error
  }
}

export async function unfavorite(
  fetch: FetchLike,
  id: string,
  headers?: Record<string, string>
): Promise<void> {
  const res = await fetch(buildUrl(`/parties/${id}/unfavorite`), {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  })
  
  if (!res.ok) {
    const error = await parseError(res)
    throw error
  }
}

export async function deleteParty(
  fetch: FetchLike,
  id: string,
  headers?: Record<string, string>
): Promise<void> {
  const res = await fetch(buildUrl(`/parties/${id}`), {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  })
  
  if (!res.ok) {
    const error = await parseError(res)
    throw error
  }
}

// Grid update functions
export async function updateWeaponGrid(
  fetch: FetchLike,
  partyId: string,
  payload: any,
  headers?: Record<string, string>
): Promise<Party> {
  const body = camelToSnake(payload)
  const res = await fetch(buildUrl(`/parties/${partyId}/grid_weapons`), {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })
  
  if (!res.ok) {
    const error = await parseError(res)
    throw error
  }
  
  const json = await res.json()
  
  // Handle conflict response
  if ('conflicts' in json) {
    const conflict = ConflictResponseSchema.parse(json)
    throw {
      type: 'conflict',
      ...conflict
    }
  }
  
  const parsed = PartyResponseSchema.parse(json)
  return parseParty(parsed.party)
}

export async function updateSummonGrid(
  fetch: FetchLike,
  partyId: string,
  payload: any,
  headers?: Record<string, string>
): Promise<Party> {
  const body = camelToSnake(payload)
  const res = await fetch(buildUrl(`/parties/${partyId}/grid_summons`), {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })
  
  if (!res.ok) {
    const error = await parseError(res)
    throw error
  }
  
  const json = await res.json()
  const parsed = PartyResponseSchema.parse(json)
  return parseParty(parsed.party)
}

export async function updateCharacterGrid(
  fetch: FetchLike,
  partyId: string,
  payload: any,
  headers?: Record<string, string>
): Promise<Party> {
  const body = camelToSnake(payload)
  const res = await fetch(buildUrl(`/parties/${partyId}/grid_characters`), {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })
  
  if (!res.ok) {
    const error = await parseError(res)
    throw error
  }
  
  const json = await res.json()
  
  // Handle conflict response
  if ('conflicts' in json) {
    const conflict = ConflictResponseSchema.parse(json)
    throw {
      type: 'conflict',
      ...conflict
    }
  }
  
  const parsed = PartyResponseSchema.parse(json)
  return parseParty(parsed.party)
}

// Helper to parse API errors
async function parseError(res: Response): Promise<Error> {
  let message = res.statusText || 'Request failed'
  
  try {
    const data = await res.clone().json()
    if (typeof data?.error === 'string') message = data.error
    else if (typeof data?.message === 'string') message = data.message
    else if (Array.isArray(data?.errors)) message = data.errors.join(', ')
  } catch {}
  
  const error = new Error(message) as any
  error.status = res.status
  return error
}
