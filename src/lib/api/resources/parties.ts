import { buildUrl, get, post, put, del, type FetchLike } from '$lib/api/core'
import { parseParty } from '$lib/api/schemas/party'
import type { Party } from '$lib/types/api/party'
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
): Promise<{ party: Party; editKey?: string }> {
	const url = buildUrl('/parties')
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...headers
		},
		body: JSON.stringify(camelToSnake(payload)),
		credentials: 'include'
	})

	if (!res.ok) {
		const error = await parseError(res)
		throw error
	}

	const json = await res.json()
	const party = parseParty(json.party)

	return {
		party,
		editKey: json.edit_key
	}
}

export async function update(
	fetch: FetchLike,
	id: string,
	payload: Partial<Party>,
	headers?: Record<string, string>
): Promise<Party> {
	const url = buildUrl(`/parties/${encodeURIComponent(id)}`)
	const res = await fetch(url, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			...headers
		},
		body: JSON.stringify(camelToSnake(payload)),
		credentials: 'include'
	})

	if (!res.ok) {
		const error = await parseError(res)
		throw error
	}

	const json = await res.json()
	return parseParty(json.party || json)
}

export async function remix(
	fetch: FetchLike,
	shortcode: string,
	localId?: string,
	headers?: Record<string, string>
): Promise<{ party: Party; editKey?: string }> {
	const url = buildUrl(`/parties/${encodeURIComponent(shortcode)}/remix`)
	const payload = localId ? { local_id: localId } : {}

	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...headers
		},
		body: JSON.stringify(payload),
		credentials: 'include'
	})

	if (!res.ok) {
		const error = await parseError(res)
		throw error
	}

	const json = await res.json()
	const party = parseParty(json.party)

	return {
		party,
		editKey: json.edit_key
	}
}

export async function deleteParty(
	fetch: FetchLike,
	id: string,
	headers?: Record<string, string>
): Promise<void> {
	const url = buildUrl(`/parties/${encodeURIComponent(id)}`)
	const res = await fetch(url, {
		method: 'DELETE',
		headers: {
			...headers
		},
		credentials: 'include'
	})

	if (!res.ok) {
		const error = await parseError(res)
		throw error
	}
}

export async function getUserParties(
	fetch: FetchLike,
	username: string,
	filters?: {
		raid?: string
		element?: number
		recency?: number
		page?: number
	}
): Promise<{
	parties: Party[]
	meta?: {
		count?: number
		totalPages?: number
		perPage?: number
	}
}> {
	const params = new URLSearchParams()
	if (filters?.raid) params.set('raid', filters.raid)
	if (filters?.element !== undefined) params.set('element', filters.element.toString())
	if (filters?.recency !== undefined) params.set('recency', filters.recency.toString())
	if (filters?.page !== undefined) params.set('page', filters.page.toString())

	const queryString = params.toString()
	const url = buildUrl(`/users/${encodeURIComponent(username)}/parties${queryString ? `?${queryString}` : ''}`)

	const res = await fetch(url, { credentials: 'include' })

	if (!res.ok) {
		const error = await parseError(res)
		throw error
	}

	const json = await res.json()
	const parsed = PaginatedPartiesSchema.safeParse(json)

	if (!parsed.success) {
		// Fallback for different response formats
		const fallback = PartiesResponseSchema.safeParse(json)
		if (fallback.success) {
			return {
				parties: fallback.data.parties.map(parseParty)
			}
		}
		throw new Error('Invalid response format')
	}

	return {
		parties: parsed.data.results.map(parseParty),
		meta: parsed.data.meta
			? {
					count: parsed.data.meta.count,
					totalPages: parsed.data.meta.total_pages,
					perPage: parsed.data.meta.per_page
				}
			: undefined
	}
}

// Grid operations
export async function updateWeaponGrid(
	fetch: FetchLike,
	partyId: string,
	payload: any,
	headers?: Record<string, string>
): Promise<Party> {
	const url = buildUrl(`/parties/${encodeURIComponent(partyId)}/grid_weapons`)
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...headers
		},
		body: JSON.stringify(camelToSnake(payload)),
		credentials: 'include'
	})

	if (!res.ok) {
		const error = await parseError(res)
		throw error
	}

	const json = await res.json()

	// Check for conflicts
	if (json.conflicts) {
		const error = new Error('Weapon conflict') as any
		error.conflicts = json
		throw error
	}

	return parseParty(json.party || json)
}

export async function updateSummonGrid(
	fetch: FetchLike,
	partyId: string,
	payload: any,
	headers?: Record<string, string>
): Promise<Party> {
	const url = buildUrl(`/parties/${encodeURIComponent(partyId)}/grid_summons`)
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...headers
		},
		body: JSON.stringify(camelToSnake(payload)),
		credentials: 'include'
	})

	if (!res.ok) {
		const error = await parseError(res)
		throw error
	}

	const json = await res.json()
	return parseParty(json.party || json)
}

export async function updateCharacterGrid(
	fetch: FetchLike,
	partyId: string,
	payload: any,
	headers?: Record<string, string>
): Promise<Party> {
	const url = buildUrl(`/parties/${encodeURIComponent(partyId)}/grid_characters`)
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...headers
		},
		body: JSON.stringify(camelToSnake(payload)),
		credentials: 'include'
	})

	if (!res.ok) {
		const error = await parseError(res)
		throw error
	}

	const json = await res.json()

	// Check for conflicts
	if (json.conflicts) {
		const error = new Error('Character conflict') as any
		error.conflicts = json
		throw error
	}

	return parseParty(json.party || json)
}

// Error parsing
async function parseError(res: Response): Promise<Error & { status: number; details?: any[] }> {
	let message = 'Request failed'
	let details: any[] = []

	try {
		const errorData = await res.json()
		if (errorData.error) {
			message = errorData.error
		} else if (errorData.errors) {
			if (Array.isArray(errorData.errors)) {
				message = errorData.errors.join(', ')
				details = errorData.errors
			} else if (typeof errorData.errors === 'object') {
				const messages: string[] = []
				for (const [field, errors] of Object.entries(errorData.errors)) {
					if (Array.isArray(errors)) {
						messages.push(`${field}: ${errors.join(', ')}`)
					}
				}
				message = messages.join('; ')
				details = Object.entries(errorData.errors)
			}
		}
	} catch {
		// If JSON parsing fails, use status text
		message = res.statusText || message
	}

	const error = new Error(message) as Error & { status: number; details?: any[] }
	error.status = res.status
	if (details.length > 0) {
		error.details = details
	}
	return error
}