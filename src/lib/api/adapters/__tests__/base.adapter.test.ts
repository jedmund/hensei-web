/**
 * Tests for the BaseAdapter class
 *
 * These tests verify the core functionality of the adapter system,
 * including request/response transformation and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BaseAdapter } from '../base.adapter'
import type { AdapterOptions, ApiPaginationMeta } from '../types'

/**
 * Test adapter implementation for testing BaseAdapter functionality
 */
class TestAdapter extends BaseAdapter {
	constructor(options?: AdapterOptions) {
		super(options)
	}

	// Expose protected methods for testing
	async testRequest<T>(path: string, options?: Record<string, unknown>): Promise<T> {
		return this.request<T>(path, options)
	}

	testTransformResponse<T>(data: unknown): T {
		return this.transformResponse<T>(data)
	}

	testTransformRequest(data: unknown): unknown {
		return this.transformRequest(data)
	}

	testClearCache(pattern?: string): void {
		this.clearCache(pattern)
	}

	testToPaginatedResponse<T>(
		results: T[],
		meta: ApiPaginationMeta | undefined,
		fallbackPage: number,
		fallbackPerPage?: number
	) {
		return this.toPaginatedResponse(results, meta, fallbackPage, fallbackPerPage)
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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected delay(_ms: number): Promise<void> {
		// Instant return for fast tests
		return Promise.resolve()
	}

	async testRequest<T>(path: string, options?: Record<string, unknown>): Promise<T> {
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
				retries: 5
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

			const calledUrl = vi.mocked(global.fetch).mock.calls[0]![0]
			expect(calledUrl).toContain('query=test')
			expect(calledUrl).toContain('page=2')
			// Arrays are serialized as comma-separated values
			const parsedUrl = new URL(calledUrl as string)
			expect(parsedUrl.searchParams.get('filters')).toBe('1,2,3')
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
			global.fetch = vi.fn().mockImplementation(
				(url, options) =>
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

		it('should not cancel duplicate requests in non-browser environment', async () => {
			// In non-browser env (test), duplicate request cancellation is disabled
			// to avoid cancelling other users' requests on the server
			let callCount = 0
			global.fetch = vi.fn().mockImplementation(() => {
				callCount++
				const count = callCount
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve({
							ok: true,
							json: async () => ({ data: `response-${count}` })
						})
					}, 50)
				})
			})

			// Both requests should succeed since cancellation is browser-only
			const promise1 = adapter.testRequest('/api/data')
			await new Promise((resolve) => setTimeout(resolve, 10))
			const promise2 = adapter.testRequest('/api/data')

			const [result1, result2] = await Promise.all([promise1, promise2])
			expect(result1).toEqual({ data: 'response-1' })
			expect(result2).toEqual({ data: 'response-2' })
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

	describe('toPaginatedResponse', () => {
		it('should extract pagination from meta', () => {
			const items = [{ id: 1 }, { id: 2 }]
			const meta = { count: 42, totalPages: 3, perPage: 15, currentPage: 2 }

			const result = adapter.testToPaginatedResponse(items, meta, 1)

			expect(result.results).toBe(items)
			expect(result.page).toBe(2)
			expect(result.total).toBe(42)
			expect(result.totalPages).toBe(3)
			expect(result.perPage).toBe(15)
		})

		it('should use fallbackPage when currentPage is missing', () => {
			const meta = { count: 10, totalPages: 1, perPage: 20 }

			const result = adapter.testToPaginatedResponse([], meta, 3)

			expect(result.page).toBe(3)
		})

		it('should use sensible defaults when meta is undefined', () => {
			const result = adapter.testToPaginatedResponse([], undefined, 1)

			expect(result.results).toEqual([])
			expect(result.page).toBe(1)
			expect(result.total).toBe(0)
			expect(result.totalPages).toBe(1)
			expect(result.perPage).toBe(20)
		})

		it('should respect custom fallbackPerPage', () => {
			const result = adapter.testToPaginatedResponse([], undefined, 1, 15)

			expect(result.perPage).toBe(15)
		})

		it('should prefer meta.perPage over fallbackPerPage', () => {
			const meta = { count: 5, totalPages: 1, perPage: 10 }

			const result = adapter.testToPaginatedResponse([], meta, 1, 15)

			expect(result.perPage).toBe(10)
		})
	})
})
