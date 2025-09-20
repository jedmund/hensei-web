/**
 * Party API resource functions - Facade layer for migration
 *
 * This module provides backward compatibility during the migration
 * from api/core to the adapter pattern. Services can continue using
 * these functions while we migrate them incrementally.
 */

import { partyAdapter } from '$lib/api/adapters'
import type { Party } from '$lib/types/api/party'
import { z } from 'zod'

// FetchLike type for backward compatibility
export type FetchLike = typeof fetch

// API functions - Now using PartyAdapter
export async function getByShortcode(fetch: FetchLike, shortcode: string): Promise<Party> {
	// Ignore fetch parameter - adapter handles its own fetching
	return partyAdapter.getByShortcode(shortcode)
}

export async function create(
	fetch: FetchLike,
	payload: Partial<Party>,
	headers?: Record<string, string>
): Promise<{ party: Party; editKey?: string }> {
	// The adapter returns the party directly, we need to wrap it
	// to maintain backward compatibility with editKey
	const party = await partyAdapter.create(payload, headers)

	// Note: editKey is returned in headers by the adapter if present
	// For now, we'll return just the party
	return {
		party,
		editKey: undefined // Edit key handling may need adjustment
	}
}

export async function update(
	fetch: FetchLike,
	id: string,
	payload: Partial<Party>,
	headers?: Record<string, string>
): Promise<Party> {
	return partyAdapter.update({ shortcode: id, ...payload }, headers)
}

export async function remix(
	fetch: FetchLike,
	shortcode: string,
	localId?: string,
	headers?: Record<string, string>
): Promise<{ party: Party; editKey?: string }> {
	const party = await partyAdapter.remix(shortcode, headers)

	return {
		party,
		editKey: undefined // Edit key handling may need adjustment
	}
}

export async function deleteParty(
	fetch: FetchLike,
	id: string,
	headers?: Record<string, string>
): Promise<void> {
	return partyAdapter.delete(id, headers)
}

/**
 * List public parties for explore page
 */
export async function list(
	fetch: FetchLike,
	params?: {
		page?: number
		per_page?: number
		raid_id?: string
		element?: number
	}
): Promise<{
	items: Party[]
	total: number
	totalPages: number
	perPage: number
}> {
	// Map parameters to adapter format
	const adapterParams = {
		page: params?.page,
		per: params?.per_page,
		raidId: params?.raid_id,
		element: params?.element
	}

	const response = await partyAdapter.list(adapterParams)

	// Map adapter response to expected format
	return {
		items: response.results,
		total: response.total,
		totalPages: response.totalPages,
		perPage: response.per || 20
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
	// Map parameters to adapter format
	const adapterParams = {
		username,
		page: filters?.page,
		per: 20, // Default page size
		visibility: undefined, // Not specified in original
		raidId: filters?.raid,
		element: filters?.element,
		recency: filters?.recency
	}

	const response = await partyAdapter.listUserParties(adapterParams)

	// Map adapter response to expected format
	return {
		parties: response.results,
		meta: {
			count: response.total,
			totalPages: response.totalPages,
			perPage: response.per || 20
		}
	}
}

// Grid operations - These should eventually move to GridAdapter
export async function updateWeaponGrid(
	fetch: FetchLike,
	partyId: string,
	payload: any,
	headers?: Record<string, string>
): Promise<Party> {
	// For now, use gridUpdate with a single operation
	// This is a temporary implementation until GridAdapter is fully integrated
	const operation = {
		type: 'add' as const,
		entity: 'weapon' as const,
		...payload
	}

	const response = await partyAdapter.gridUpdate(partyId, [operation])

	// Check for conflicts
	if ('conflicts' in response && response.conflicts) {
		const error = new Error('Weapon conflict') as any
		error.conflicts = response
		throw error
	}

	return response.party
}

export async function updateSummonGrid(
	fetch: FetchLike,
	partyId: string,
	payload: any,
	headers?: Record<string, string>
): Promise<Party> {
	// For now, use gridUpdate with a single operation
	const operation = {
		type: 'add' as const,
		entity: 'summon' as const,
		...payload
	}

	const response = await partyAdapter.gridUpdate(partyId, [operation])
	return response.party
}

export async function updateCharacterGrid(
	fetch: FetchLike,
	partyId: string,
	payload: any,
	headers?: Record<string, string>
): Promise<Party> {
	// For now, use gridUpdate with a single operation
	const operation = {
		type: 'add' as const,
		entity: 'character' as const,
		...payload
	}

	const response = await partyAdapter.gridUpdate(partyId, [operation])

	// Check for conflicts
	if ('conflicts' in response && response.conflicts) {
		const error = new Error('Character conflict') as any
		error.conflicts = response
		throw error
	}

	return response.party
}