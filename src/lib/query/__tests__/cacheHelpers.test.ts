/**
 * Cache helper tests
 *
 * Tests resolvePartyShortcode and invalidateParty utilities.
 * Uses real QueryClient instances seeded with cache data.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolvePartyShortcode, invalidateParty } from '../cacheHelpers'
import { createTestQueryClient, seedPartyCache } from '$lib/api/mutations/__tests__/helpers'
import { MOCK_PARTY, MOCK_SHORTCODE } from '$lib/api/mutations/__tests__/fixtures'
import type { QueryClient } from '@tanstack/svelte-query'

let queryClient: QueryClient

beforeEach(() => {
	queryClient = createTestQueryClient()
	seedPartyCache(queryClient, MOCK_PARTY)
})

// ============================================================================
// resolvePartyShortcode
// ============================================================================

describe('resolvePartyShortcode', () => {
	it('returns short alphanumeric strings as-is', () => {
		expect(resolvePartyShortcode(queryClient, 'ABC123')).toBe('ABC123')
	})

	it('returns short strings with hyphens/underscores as-is', () => {
		expect(resolvePartyShortcode(queryClient, 'my-party_1')).toBe('my-party_1')
	})

	it('returns numeric input as string', () => {
		expect(resolvePartyShortcode(queryClient, 42)).toBe('42')
	})

	it('resolves UUID to shortcode from cache', () => {
		const result = resolvePartyShortcode(queryClient, MOCK_PARTY.id)
		expect(result).toBe(MOCK_SHORTCODE)
	})

	it('falls back to input when UUID not found in cache', () => {
		const unknownUuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
		expect(resolvePartyShortcode(queryClient, unknownUuid)).toBe(unknownUuid)
	})

	it('handles empty cache gracefully', () => {
		const emptyClient = createTestQueryClient()
		const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
		expect(resolvePartyShortcode(emptyClient, uuid)).toBe(uuid)
	})
})

// ============================================================================
// invalidateParty
// ============================================================================

describe('invalidateParty', () => {
	it('invalidates by shortcode', async () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')

		await invalidateParty(queryClient, MOCK_SHORTCODE)

		expect(spy).toHaveBeenCalledWith({
			queryKey: ['party', MOCK_SHORTCODE]
		})
	})

	it('resolves UUID then invalidates correct key', async () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')

		await invalidateParty(queryClient, MOCK_PARTY.id)

		expect(spy).toHaveBeenCalledWith({
			queryKey: ['party', MOCK_SHORTCODE]
		})
	})
})
