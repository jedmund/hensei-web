/**
 * Tests for the BaseAdapter class
 *
 * These tests verify the core functionality of the adapter system,
 * including request/response transformation, error handling, and caching.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BaseAdapter } from '../base.adapter'
import { ApiError, NetworkError } from '../errors'
import type { AdapterOptions } from '../types'

/**
 * Test adapter implementation for testing BaseAdapter functionality
 */
class TestAdapter extends BaseAdapter {
	constructor(options?: AdapterOptions) {
		super(options)
	}

	// Expose protected methods for testing
	async testRequest<T>(path: string, options?: any): Promise<T> {
		return this.request<T>(path, options)
	}

	testTransformResponse<T>(data: any): T {
		return this.transformResponse<T>(data)
	}

	testTransformRequest(data: any): any {
		return this.transformRequest(data)
	}

	testClearCache(pattern?: string): void {
		this.clearCache(pattern)
	}
}

/**
 * Fast test adapter with minimal retry delays for testing
 */
class FastRetryAdapter extends BaseAdapter {
	constructor(options?: AdapterOptions) {
		super(options)
	}

	// Override delay for instant retries in tests
	protected delay(ms: number): Promise<void> {
		// Instant return for fast tests
		return Promise.resolve()
	}

	async testRequest<T>(path: string, options?: any): Promise<T> {
		return this.request<T>(path, options)
	}
}

describe('BaseAdapter', () => {
	let adapter: TestAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		// Save original fetch
		originalFetch = global.fetch

		// Create a new adapter instance for each test
		adapter = new TestAdapter({
			baseURL: 'https://api.example.com',
			timeout: 5000
		})
	})

	afterEach(() => {
		// Restore original fetch
		global.fetch = originalFetch

		// Cancel any pending requests
		adapter.cancelAll()
	})

	describe('constructor', () => {
		it('should initialize with default options', () => {
			const defaultAdapter = new TestAdapter()
			expect(defaultAdapter).toBeDefined()
		})

		it('should accept custom options', () => {
			const customAdapter = new TestAdapter({
				baseURL: 'https://custom.api.com',
				timeout: 10000,
				retries: 5,
				cacheTime: 60000
			})
			expect(customAdapter).toBeDefined()
		})
	})

	describe('transformResponse', () => {
		it('should transform snake_case to camelCase', () => {
			const input = {
				user_name: 'test',
				created_at: '2024-01-01',
				nested_object: {
					inner_field: 'value'
				}
			}

			const result = adapter.testTransformResponse(input)

			expect(result).toEqual({
				userName: 'test',
				createdAt: '2024-01-01',
				nestedObject: {
					innerField: 'value'
				}
			})
		})

		it('should handle null and undefined values', () => {
			expect(adapter.testTransformResponse(null)).toBeNull()
			expect(adapter.testTransformResponse(undefined)).toBeUndefined()
		})

		it('should transform arrays', () => {
			const input = [
				{ user_id: 1, user_name: 'Alice' },
				{ user_id: 2, user_name: 'Bob' }
			]

			const result = adapter.testTransformResponse(input)

			expect(result).toEqual([
				{ userId: 1, userName: 'Alice' },
				{ userId: 2, userName: 'Bob' }
			])
		})
	})

	describe('transformRequest', () => {
		it('should transform camelCase to snake_case', () => {
			const input = {
				userName: 'test',
				createdAt: '2024-01-01',
				nestedObject: {
					innerField: 'value'
				}
			}

			const result = adapter.testTransformRequest(input)

			expect(result).toEqual({
				user_name: 'test',
				created_at: '2024-01-01',
				nested_object: {
					inner_field: 'value'
				}
			})
		})

		it('should handle null and undefined values', () => {
			expect(adapter.testTransformRequest(null)).toBeNull()
			expect(adapter.testTransformRequest(undefined)).toBeUndefined()
		})
	})

	describe('request', () => {
		it('should make a successful GET request', async () => {
			// Mock successful response
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ success: true, user_name: 'test' })
			})

			const result = await adapter.testRequest('/users/1')

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/users/1',
				expect.objectContaining({
					credentials: 'include',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					})
				})
			)

			// Should transform the response
			expect(result).toEqual({ success: true, userName: 'test' })
		})

		it('should make a POST request with body', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ id: 1, created: true })
			})

			const body = { userName: 'test', email: 'test@example.com' }

			await adapter.testRequest('/users', {
				method: 'POST',
				body: JSON.stringify(body)
			})

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/users',
				expect.objectContaining({
					method: 'POST',
					// Body should be transformed to snake_case
					body: JSON.stringify({ user_name: 'test', email: 'test@example.com' })
				})
			)
		})

		it('should add query parameters to URL', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ results: [] })
			})

			await adapter.testRequest('/search', {
				params: {
					query: 'test',
					page: 2,
					filters: [1, 2, 3]
				}
			})

			const calledUrl = (global.fetch as any).mock.calls[0][0]
			expect(calledUrl).toContain('query=test')
			expect(calledUrl).toContain('page=2')
			expect(calledUrl).toContain('filters=1')
			expect(calledUrl).toContain('filters=2')
			expect(calledUrl).toContain('filters=3')
		})

		it('should handle error responses', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				statusText: 'Not Found',
				json: async () => ({ error: 'User not found' })
			})

			await expect(adapter.testRequest('/users/999')).rejects.toMatchObject({
				name: 'AdapterError',
				code: 'NOT_FOUND',
				status: 404,
				message: 'User not found'
			})
		})

		it('should handle network errors', async () => {
			global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

			await expect(adapter.testRequest('/users')).rejects.toMatchObject({
				name: 'AdapterError',
				code: 'UNKNOWN_ERROR',
				status: 0
			})
		})

		it('should handle request cancellation', async () => {
			// Mock a delayed response that respects AbortSignal
			global.fetch = vi.fn().mockImplementation((url, options) =>
				new Promise((resolve, reject) => {
					const timeout = setTimeout(() => {
						resolve({
							ok: true,
							json: async () => ({ data: 'test' })
						})
					}, 100)

					// Listen for abort signal
					if (options?.signal) {
						options.signal.addEventListener('abort', () => {
							clearTimeout(timeout)
							const error = new Error('The operation was aborted')
							error.name = 'AbortError'
							reject(error)
						})
					}
				})
			)

			// Start request
			const promise = adapter.testRequest('/slow')

			// Cancel immediately
			adapter.cancelAll()

			// Should throw cancelled error
			await expect(promise).rejects.toMatchObject({
				code: 'CANCELLED',
				message: 'Request was cancelled'
			})
		})

		it('should cancel duplicate requests to the same endpoint', async () => {
			let abortHandlers: Array<() => void> = []

			// Mock sequential requests with proper abort handling
			let callCount = 0
			global.fetch = vi.fn().mockImplementation((url, options) => {
				callCount++
				return new Promise((resolve, reject) => {
					const timeout = setTimeout(() => {
						resolve({
							ok: true,
							json: async () => ({ data: `response-${callCount}` })
						})
					}, 50)

					// Store abort handler
					if (options?.signal) {
						const handler = () => {
							clearTimeout(timeout)
							const error = new Error('The operation was aborted')
							error.name = 'AbortError'
							reject(error)
						}
						options.signal.addEventListener('abort', handler)
						abortHandlers[callCount - 1] = handler
					}
				})
			})

			// Start first request
			const promise1 = adapter.testRequest('/api/data')

			// Wait a bit to ensure first request is in progress
			await new Promise(resolve => setTimeout(resolve, 10))

			// Start second request to same endpoint (should cancel first)
			const promise2 = adapter.testRequest('/api/data')

			// First should be cancelled
			await expect(promise1).rejects.toMatchObject({
				code: 'CANCELLED'
			})

			// Second should succeed
			const result = await promise2
			expect(result).toEqual({ data: 'response-2' })
		})
	})

	describe('retry logic', () => {
		it('should retry on network errors', async () => {
			let attempts = 0

			global.fetch = vi.fn().mockImplementation(async () => {
				attempts++
				if (attempts < 3) {
					// First two attempts: network error
					const error = new Error('Network error')
					error.name = 'NetworkError'
					throw error
				} else {
					// Third attempt: succeed
					return {
						ok: true,
						json: async () => ({ success: true })
					}
				}
			})

			const quickAdapter = new FastRetryAdapter({
				baseURL: 'https://api.example.com',
				retries: 3
			})

			// This should retry and eventually succeed
			const result = await quickAdapter.testRequest('/retry')

			// Verify it retried
			expect(attempts).toBe(3)
			expect(result).toEqual({ success: true })
		})

		it('should not retry on client errors', async () => {
			let attempts = 0

			global.fetch = vi.fn().mockImplementation(() => {
				attempts++
				return Promise.resolve({
					ok: false,
					status: 400,
					statusText: 'Bad Request',
					json: async () => ({ error: 'Invalid input' })
				})
			})

			await expect(adapter.testRequest('/bad')).rejects.toMatchObject({
				code: 'BAD_REQUEST',
				status: 400
			})

			// Should not retry on 400 error
			expect(attempts).toBe(1)
		})

		it('should retry on server errors', async () => {
			let attempts = 0

			global.fetch = vi.fn().mockImplementation(async () => {
				attempts++
				if (attempts < 2) {
					return {
						ok: false,
						status: 503,
						statusText: 'Service Unavailable',
						json: async () => ({ error: 'Server down' })
					}
				}
				return {
					ok: true,
					json: async () => ({ success: true })
				}
			})

			const quickAdapter = new FastRetryAdapter({
				baseURL: 'https://api.example.com',
				retries: 2
			})

			// This should retry and eventually succeed
			const result = await quickAdapter.testRequest('/server')

			// Verify it retried
			expect(attempts).toBe(2)
			expect(result).toEqual({ success: true })
		})
	})

	describe('caching', () => {
		it('should cache GET requests when cacheTime is set', async () => {
			let fetchCount = 0

			global.fetch = vi.fn().mockImplementation(() => {
				fetchCount++
				return Promise.resolve({
					ok: true,
					json: async () => ({ data: 'cached', count: fetchCount })
				})
			})

			// Make first request with caching
			const result1 = await adapter.testRequest('/cached', {
				cache: 60000 // 1 minute
			})

			// Make second request (should use cache)
			const result2 = await adapter.testRequest('/cached', {
				cache: 60000
			})

			// Only one fetch should have been made
			expect(fetchCount).toBe(1)
			expect(result1).toEqual(result2)
		})

		it('should cache POST requests with same body when cache is enabled', async () => {
			let fetchCount = 0

			global.fetch = vi.fn().mockImplementation(() => {
				fetchCount++
				return Promise.resolve({
					ok: true,
					json: async () => ({ count: fetchCount })
				})
			})

			// Make first POST request with cache
			const result1 = await adapter.testRequest('/data', {
				method: 'POST',
				cache: 60000,
				body: JSON.stringify({ test: true })
			})

			// Make second POST request with same body (should use cache)
			const result2 = await adapter.testRequest('/data', {
				method: 'POST',
				cache: 60000,
				body: JSON.stringify({ test: true })
			})

			// Only one request should have been made
			expect(fetchCount).toBe(1)
			expect(result1).toEqual(result2)

			// Make POST request with different body (should not use cache)
			await adapter.testRequest('/data', {
				method: 'POST',
				cache: 60000,
				body: JSON.stringify({ test: false })
			})

			// Now two requests should have been made
			expect(fetchCount).toBe(2)
		})

		it('should clear cache', async () => {
			let fetchCount = 0

			global.fetch = vi.fn().mockImplementation(() => {
				fetchCount++
				return Promise.resolve({
					ok: true,
					json: async () => ({ count: fetchCount })
				})
			})

			// Make cached request
			await adapter.testRequest('/cached', { cache: 60000 })

			// Clear cache
			adapter.testClearCache()

			// Make request again (should fetch again)
			await adapter.testRequest('/cached', { cache: 60000 })

			expect(fetchCount).toBe(2)
		})

		it('should clear cache by pattern', async () => {
			let fetchCount = 0

			global.fetch = vi.fn().mockImplementation(() => {
				fetchCount++
				return Promise.resolve({
					ok: true,
					json: async () => ({ data: 'test' })
				})
			})

			// Cache multiple endpoints
			await adapter.testRequest('/users/1', { cache: 60000 })
			await adapter.testRequest('/posts/1', { cache: 60000 })

			// Clear only user cache
			adapter.testClearCache('users')

			// Users should refetch, posts should use cache
			await adapter.testRequest('/users/1', { cache: 60000 })
			await adapter.testRequest('/posts/1', { cache: 60000 })

			// 3 total fetches: initial 2 + 1 refetch for users
			expect(fetchCount).toBe(3)
		})
	})

	describe('error handling', () => {
		it('should call global error handler', async () => {
			const errorHandler = vi.fn()

			const adapterWithHandler = new TestAdapter({
				baseURL: 'https://api.example.com',
				onError: errorHandler
			})

			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
				json: async () => ({ error: 'Server error' })
			})

			await expect(adapterWithHandler.testRequest('/error')).rejects.toThrow()

			expect(errorHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					code: 'SERVER_ERROR',
					status: 500,
					message: 'Server error'
				})
			)
		})

		it('should handle non-JSON error responses', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
				json: async () => {
					throw new Error('Invalid JSON')
				}
			})

			await expect(adapter.testRequest('/error')).rejects.toMatchObject({
				code: 'SERVER_ERROR',
				status: 500,
				message: 'Internal Server Error'
			})
		})
	})
})