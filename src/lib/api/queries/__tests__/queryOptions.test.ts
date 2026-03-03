import { describe, it, expect } from 'vitest'

import { userQueries } from '../user.queries'
import { artifactQueries } from '../artifact.queries'
import { collectionQueries } from '../collection.queries'
import { crewQueries } from '../crew.queries'
import { partyQueries } from '../party.queries'
import { raidQueries } from '../raid.queries'
import { searchQueries } from '../search.queries'

// ============================================================================
// Enabled Conditions
// ============================================================================

describe('enabled conditions', () => {
	describe('userQueries.checkUsername', () => {
		it('disabled for empty string', () => {
			expect(userQueries.checkUsername('').enabled).toBe(false)
		})

		it('disabled for short username (< 3 chars)', () => {
			expect(userQueries.checkUsername('ab').enabled).toBe(false)
		})

		it('enabled for username >= 3 chars', () => {
			expect(userQueries.checkUsername('abc').enabled).toBe(true)
		})
	})

	describe('userQueries.checkEmail', () => {
		it('disabled for empty string', () => {
			expect(userQueries.checkEmail('').enabled).toBe(false)
		})

		it('disabled when missing @', () => {
			expect(userQueries.checkEmail('nope').enabled).toBe(false)
		})

		it('enabled when contains @', () => {
			expect(userQueries.checkEmail('a@b').enabled).toBe(true)
		})
	})

	describe('artifactQueries.skillsForSlot', () => {
		it('disabled for slot 0', () => {
			expect(artifactQueries.skillsForSlot(0).enabled).toBe(false)
		})

		it('enabled for slot 1', () => {
			expect(artifactQueries.skillsForSlot(1).enabled).toBe(true)
		})

		it('enabled for slot 4', () => {
			expect(artifactQueries.skillsForSlot(4).enabled).toBe(true)
		})

		it('disabled for slot 5', () => {
			expect(artifactQueries.skillsForSlot(5).enabled).toBe(false)
		})
	})

	describe('collectionQueries.counts', () => {
		it('disabled for empty userId', () => {
			expect(collectionQueries.counts('').enabled).toBe(false)
		})

		it('disabled when enabled=false', () => {
			expect(collectionQueries.counts('u-1', false).enabled).toBe(false)
		})

		it('enabled for valid userId with enabled=true', () => {
			expect(collectionQueries.counts('u-1', true).enabled).toBe(true)
		})
	})

	describe('generic !!id enabled', () => {
		it('partyQueries.byShortcode disabled for empty string', () => {
			expect(partyQueries.byShortcode('').enabled).toBe(false)
		})

		it('partyQueries.byShortcode enabled for truthy string', () => {
			expect(partyQueries.byShortcode('abc').enabled).toBe(true)
		})

		it('raidQueries.bySlug disabled for empty string', () => {
			expect(raidQueries.bySlug('').enabled).toBe(false)
		})

		it('raidQueries.bySlug enabled for truthy string', () => {
			expect(raidQueries.bySlug('proto').enabled).toBe(true)
		})

		it('searchQueries.characters can be disabled', () => {
			const opts = searchQueries.characters('', undefined, 'en', undefined, false)
			expect(opts.enabled).toBe(false)
		})
	})
})

// ============================================================================
// Retry Logic
// ============================================================================

describe('retry logic', () => {
	describe('crewQueries.myCrew', () => {
		const opts = crewQueries.myCrew()
		const retry = opts.retry as (failureCount: number, error: unknown) => boolean

		it('does not retry on 404', () => {
			expect(retry(0, { status: 404 })).toBe(false)
		})

		it('retries on 500 when failureCount < 3', () => {
			expect(retry(0, { status: 500 })).toBe(true)
			expect(retry(2, { status: 500 })).toBe(true)
		})

		it('stops retrying after 3 failures', () => {
			expect(retry(3, { status: 500 })).toBe(false)
		})

		it('retries on generic error', () => {
			expect(retry(0, new Error('network'))).toBe(true)
		})
	})

	describe('collectionQueries.granblueIds', () => {
		const opts = collectionQueries.granblueIds('u-1')
		const retry = opts.retry as (failureCount: number, error: unknown) => boolean

		it('does not retry on 403', () => {
			expect(retry(0, { status: 403 })).toBe(false)
		})

		it('does not retry on 404', () => {
			expect(retry(0, { status: 404 })).toBe(false)
		})

		it('retries on 500 when failureCount < 3', () => {
			expect(retry(0, { status: 500 })).toBe(true)
			expect(retry(2, { status: 500 })).toBe(true)
		})

		it('stops retrying after 3 failures', () => {
			expect(retry(3, { status: 500 })).toBe(false)
		})
	})
})

// ============================================================================
// Pagination (getNextPageParam)
// ============================================================================

describe('getNextPageParam', () => {
	it('returns next page when more pages available', () => {
		const opts = partyQueries.list()
		const getNext = opts.getNextPageParam!
		const result = getNext({ results: [], page: 2, totalPages: 5 } as any, [], 2, [])
		expect(result).toBe(3)
	})

	it('returns undefined on last page', () => {
		const opts = partyQueries.list()
		const getNext = opts.getNextPageParam!
		const result = getNext({ results: [], page: 5, totalPages: 5 } as any, [], 5, [])
		expect(result).toBeUndefined()
	})

	it('works for search queries', () => {
		const opts = searchQueries.weapons()
		const getNext = opts.getNextPageParam!
		expect(getNext({ results: [], page: 1, totalPages: 3 } as any, [], 1, [])).toBe(2)
		expect(getNext({ results: [], page: 3, totalPages: 3 } as any, [], 3, [])).toBeUndefined()
	})

	it('works for user parties', () => {
		const opts = userQueries.parties('alice')
		const getNext = opts.getNextPageParam!
		expect(getNext({ results: [], page: 1, totalPages: 2 } as any, [], 1, [])).toBe(2)
		expect(getNext({ results: [], page: 2, totalPages: 2 } as any, [], 2, [])).toBeUndefined()
	})

	it('works for crew shared parties', () => {
		const opts = crewQueries.sharedParties()
		const getNext = opts.getNextPageParam!
		expect(getNext({ page: 1, totalPages: 4 } as any, [], 1, [])).toBe(2)
		expect(getNext({ page: 4, totalPages: 4 } as any, [], 4, [])).toBeUndefined()
	})
})
