import { describe, it, expect, vi } from 'vitest'
import { withInitialData, prefetchQuery, prefetchInfiniteQuery, setQueryData } from '../ssr'

// ============================================================================
// withInitialData
// ============================================================================

describe('withInitialData', () => {
	it('passes data through', () => {
		const result = withInitialData({ name: 'test' })
		expect(result.initialData).toEqual({ name: 'test' })
	})

	it('converts null to undefined', () => {
		const result = withInitialData(null)
		expect(result.initialData).toBeUndefined()
	})

	it('passes undefined through', () => {
		const result = withInitialData(undefined)
		expect(result.initialData).toBeUndefined()
	})

	it('defaults updatedAt to Date.now()', () => {
		const before = Date.now()
		const result = withInitialData('data')
		const after = Date.now()
		expect(result.initialDataUpdatedAt).toBeGreaterThanOrEqual(before)
		expect(result.initialDataUpdatedAt).toBeLessThanOrEqual(after)
	})

	it('uses provided updatedAt', () => {
		const result = withInitialData('data', 1234567890)
		expect(result.initialDataUpdatedAt).toBe(1234567890)
	})
})

// ============================================================================
// prefetchQuery
// ============================================================================

describe('prefetchQuery', () => {
	it('calls queryClient.prefetchQuery with options', async () => {
		const queryClient = {
			prefetchQuery: vi.fn().mockResolvedValue(undefined)
		} as unknown as import('@tanstack/svelte-query').QueryClient

		const queryFn = vi.fn()
		await prefetchQuery(queryClient, {
			queryKey: ['test', 'key'],
			queryFn,
			staleTime: 5000,
			gcTime: 10000
		})

		expect(queryClient.prefetchQuery).toHaveBeenCalledWith({
			queryKey: ['test', 'key'],
			queryFn,
			staleTime: 5000,
			gcTime: 10000
		})
	})
})

// ============================================================================
// prefetchInfiniteQuery
// ============================================================================

describe('prefetchInfiniteQuery', () => {
	it('calls queryClient.prefetchInfiniteQuery with options', async () => {
		const queryClient = {
			prefetchInfiniteQuery: vi.fn().mockResolvedValue(undefined)
		} as unknown as import('@tanstack/svelte-query').QueryClient

		const queryFn = vi.fn()
		await prefetchInfiniteQuery(queryClient, {
			queryKey: ['infinite', 'key'],
			queryFn,
			initialPageParam: 1,
			staleTime: 5000
		})

		expect(queryClient.prefetchInfiniteQuery).toHaveBeenCalledWith({
			queryKey: ['infinite', 'key'],
			queryFn,
			initialPageParam: 1,
			staleTime: 5000,
			gcTime: undefined
		})
	})
})

// ============================================================================
// setQueryData
// ============================================================================

describe('setQueryData', () => {
	it('calls queryClient.setQueryData with key and data', () => {
		const queryClient = {
			setQueryData: vi.fn()
		} as unknown as import('@tanstack/svelte-query').QueryClient

		setQueryData(queryClient, ['my', 'key'], { value: 42 })
		expect(queryClient.setQueryData).toHaveBeenCalledWith(['my', 'key'], { value: 42 })
	})
})
