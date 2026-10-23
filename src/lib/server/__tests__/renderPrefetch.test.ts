import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'
import { storePrefetch, consumePrefetch, _resetPrefetchStoreForTests } from '../renderPrefetch'

describe('renderPrefetch', () => {
	beforeEach(() => {
		_resetPrefetchStoreForTests()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('round-trips a stash + consume', () => {
		const token = storePrefetch({ hello: 'world' })
		expect(typeof token).toBe('string')
		expect(token.length).toBeGreaterThan(0)
		const data = consumePrefetch<{ hello: string }>(token)
		expect(data).toEqual({ hello: 'world' })
	})

	it('is single-use: consuming a token a second time misses', () => {
		const token = storePrefetch({ a: 1 })
		expect(consumePrefetch(token)).toEqual({ a: 1 })
		expect(consumePrefetch(token)).toBeNull()
	})

	it('returns null for unknown tokens', () => {
		expect(consumePrefetch('not-a-real-token')).toBeNull()
	})

	it('returns null for null/undefined tokens', () => {
		expect(consumePrefetch(null)).toBeNull()
		expect(consumePrefetch(undefined)).toBeNull()
	})

	it('expires after TTL', () => {
		vi.useFakeTimers()
		const token = storePrefetch({ a: 1 })
		// TTL is 30s.
		vi.advanceTimersByTime(30_001)
		expect(consumePrefetch(token)).toBeNull()
	})

	it('mints distinct tokens for separate stashes', () => {
		const t1 = storePrefetch({ a: 1 })
		const t2 = storePrefetch({ a: 2 })
		expect(t1).not.toBe(t2)
		expect(consumePrefetch<{ a: number }>(t1)?.a).toBe(1)
		expect(consumePrefetch<{ a: number }>(t2)?.a).toBe(2)
	})
})
