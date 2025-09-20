/**
 * Base Adapter for API Communication
 *
 * This class provides the foundation for all API adapters in the application.
 * It handles common concerns like request/response transformation, error handling,
 * request cancellation, and retry logic.
 *
 * @module adapters/base
 */

import { snakeToCamel, camelToSnake } from '../schemas/transforms'
import { transformResponse, transformRequest } from '../client'
import type { AdapterOptions, RequestOptions, AdapterError } from './types'
import {
	createErrorFromStatus,
	normalizeError,
	isRetryableError,
	calculateRetryDelay,
	CancelledError
} from './errors'

/**
 * Base adapter class that all resource-specific adapters extend from.
 * Provides core functionality for API communication with built-in features:
 * - Automatic snake_case to camelCase transformation
 * - Request cancellation and deduplication
 * - Exponential backoff retry logic
 * - Normalized error handling
 *
 * @example
 * ```typescript
 * class UserAdapter extends BaseAdapter {
 *   async getUser(id: string) {
 *     return this.request(`/users/${id}`)
 *   }
 * }
 * ```
 */
export abstract class BaseAdapter {
	/** Map of request IDs to their abort controllers for cancellation */
	protected abortControllers = new Map<string, AbortController>()

	/** Cache for storing request responses */
	protected cache = new Map<string, { data: any; expires: number }>()

	/** Configuration options for the adapter */
	protected options: Required<AdapterOptions>

	/**
	 * Creates a new adapter instance
	 *
	 * @param options - Configuration options for the adapter
	 * @param options.baseURL - Base URL for API requests (defaults to API_BASE)
	 * @param options.timeout - Default timeout for requests in milliseconds
	 * @param options.retries - Number of retry attempts for failed requests
	 * @param options.cacheTime - Default cache duration in milliseconds
	 * @param options.onError - Global error handler callback
	 */
	constructor(options: AdapterOptions = {}) {
		// Default to localhost if no baseURL provided
		const baseURL = options.baseURL ?? 'http://localhost:3000/api/v1'
		this.options = {
			baseURL,
			timeout: options.timeout ?? 30000,
			retries: options.retries ?? 3,
			cacheTime: options.cacheTime ?? 0,
			onError: options.onError
		}
	}

	/**
	 * Makes an HTTP request with automatic transformation and error handling
	 *
	 * @template T - The expected response type
	 * @param path - The API endpoint path (relative to baseURL)
	 * @param options - Request configuration options
	 * @returns Promise resolving to the transformed response data
	 * @throws {AdapterError} When the request fails or returns an error status
	 *
	 * @example
	 * ```typescript
	 * const data = await this.request<User>('/users/123', {
	 *   method: 'GET',
	 *   cache: 60000 // Cache for 1 minute
	 * })
	 * ```
	 */
	protected async request<T>(
		path: string,
		options: RequestOptions = {}
	): Promise<T> {
		// Build the full URL with query parameters (support both params and query)
		const url = this.buildURL(path, options.query || options.params)

		// Generate a unique ID for this request (used for cancellation and caching)
		const requestId = this.generateRequestId(path, options.method, options.body as string)

		// Check cache first if caching is enabled (support both cache and cacheTTL)
		const cacheTime = options.cacheTTL ?? options.cache ?? this.options.cacheTime
		// Allow caching for any method if explicitly set
		if (cacheTime > 0) {
			const cached = this.getFromCache(requestId)
			if (cached !== null) {
				return cached as T
			}
		}

		// Cancel any existing request to the same endpoint
		this.cancelRequest(requestId)

		// Create new abort controller for this request
		const controller = new AbortController()
		this.abortControllers.set(requestId, controller)

		// Prepare request options
		const fetchOptions: RequestInit = {
			credentials: 'include', // Default: Include cookies for authentication
			...options, // Allow overriding defaults
			signal: controller.signal,
			headers: {
				'Content-Type': 'application/json',
				...(options.headers || {})
			}
		}

		// Transform request body from camelCase to snake_case if present
		if (options.body) {
			if (typeof options.body === 'object') {
				// Body is an object, transform and stringify
				fetchOptions.body = JSON.stringify(this.transformRequest(options.body))
			} else if (typeof options.body === 'string') {
				try {
					const bodyData = JSON.parse(options.body)
					fetchOptions.body = JSON.stringify(this.transformRequest(bodyData))
				} catch {
					// If body is not valid JSON, use as-is
					fetchOptions.body = options.body
				}
			}
		}

		try {
			// Make the request with retry logic (errors handled inside fetchWithRetry)
			const response = await this.fetchWithRetry(url, fetchOptions, options.retries)

			// Parse and transform the response
			const data = await response.json()
			const transformed = this.transformResponse<T>(data)

			// Cache the successful response if caching is enabled (use cacheTTL or cache)
			if (cacheTime > 0) {
				this.setCache(requestId, transformed, cacheTime)
			}

			return transformed
		} catch (error: any) {
			// Handle request cancellation
			if (error.name === 'AbortError') {
				throw new CancelledError().toJSON()
			}

			// Error is already normalized from fetchWithRetry (or handleErrorResponse)
			// Only normalize if it's not already an AdapterError structure
			const normalizedError = error.name === 'AdapterError' ? error : normalizeError(error)

			// Call global error handler if provided
			if (this.options.onError) {
				this.options.onError(normalizedError)
			}

			throw normalizedError
		} finally {
			// Clean up the abort controller
			this.abortControllers.delete(requestId)
		}
	}

	/**
	 * Transforms response data from snake_case to camelCase and object->entity
	 *
	 * @template T - The expected response type
	 * @param data - Raw response data from the API
	 * @returns Transformed data with camelCase property names and proper entity fields
	 */
	protected transformResponse<T>(data: any): T {
		if (data === null || data === undefined) {
			return data
		}

		// Apply full transformation: snake_case->camelCase and object->entity
		return transformResponse<T>(data)
	}

	/**
	 * Transforms request data from camelCase to snake_case and entity->object
	 *
	 * @param data - Request data with camelCase property names and entity fields
	 * @returns Transformed data with snake_case property names and object fields
	 */
	protected transformRequest(data: any): any {
		if (data === null || data === undefined) {
			return data
		}

		// Apply full transformation: entity->object and camelCase->snake_case
		return transformRequest(data)
	}

	/**
	 * Cancels a pending request by its ID
	 *
	 * @param requestId - The unique identifier of the request to cancel
	 */
	protected cancelRequest(requestId: string): void {
		const controller = this.abortControllers.get(requestId)
		if (controller) {
			controller.abort()
			this.abortControllers.delete(requestId)
		}
	}

	/**
	 * Cancels all pending requests
	 * Useful for cleanup when unmounting components or changing views
	 */
	cancelAll(): void {
		// Abort all pending requests
		this.abortControllers.forEach(controller => controller.abort())
		this.abortControllers.clear()
	}

	/**
	 * Performs a fetch request with automatic retry on failure
	 *
	 * @param url - The URL to fetch
	 * @param options - Fetch options
	 * @param maxRetries - Maximum number of retry attempts
	 * @param attempt - Current attempt number (internal use)
	 * @returns Promise resolving to the fetch Response
	 */
	private async fetchWithRetry(
		url: string,
		options: RequestInit,
		maxRetries?: number,
		attempt = 1
	): Promise<Response> {
		const retries = maxRetries ?? this.options.retries

		try {
			// Add timeout to the request if specified
			let response: Response
			if (this.options.timeout > 0) {
				const timeoutId = setTimeout(() => {
					const controller = Array.from(this.abortControllers.values())
						.find(c => c.signal === options.signal)
					controller?.abort()
				}, this.options.timeout)

				response = await fetch(url, options)
				clearTimeout(timeoutId)
			} else {
				response = await fetch(url, options)
			}

			// Check if response has an error status that should be retried
			if (!response.ok) {
				const error = await this.handleErrorResponse(response)

				// Check if this error is retryable
				if (attempt < retries && isRetryableError(error)) {
					// Calculate delay with exponential backoff and jitter
					const delay = calculateRetryDelay(attempt, error)

					// Wait before retrying
					await this.delay(delay)

					// Recursive retry
					return this.fetchWithRetry(url, options, retries, attempt + 1)
				}

				// Not retryable or max retries reached
				throw error
			}

			return response
		} catch (error: any) {
			// Don't retry on abort
			if (error.name === 'AbortError') {
				throw error
			}

			// Normalize the error to check if it's retryable
			const normalizedError = normalizeError(error)

			// Check if we should retry (handles both network errors and HTTP errors)
			if (attempt < retries && isRetryableError(normalizedError)) {
				// Calculate delay with exponential backoff and jitter
				const delay = calculateRetryDelay(attempt, normalizedError)

				// Wait before retrying
				await this.delay(delay)

				// Recursive retry
				return this.fetchWithRetry(url, options, retries, attempt + 1)
			}

			// Max retries reached or non-retryable error
			// Throw the normalized error
			throw normalizedError
		}
	}


	/**
	 * Delays execution for a specified duration
	 * Used for retry backoff
	 *
	 * @param ms - Milliseconds to delay
	 * @returns Promise that resolves after the delay
	 */
	protected delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	/**
	 * Builds a complete URL from a path and optional query parameters
	 *
	 * @param path - The API endpoint path
	 * @param params - Optional query parameters
	 * @returns The complete URL string
	 */
	private buildURL(path: string, params?: Record<string, any>): string {
		// Handle absolute URLs
		if (path.startsWith('http://') || path.startsWith('https://')) {
			const url = new URL(path)
			this.addQueryParams(url, params)
			return url.toString()
		}

		// Build URL from base URL and path
		const baseURL = this.options.baseURL.replace(/\/$/, '') // Remove trailing slash
		const cleanPath = path.startsWith('/') ? path : `/${path}`
		const url = new URL(`${baseURL}${cleanPath}`)

		this.addQueryParams(url, params)
		return url.toString()
	}

	/**
	 * Adds query parameters to a URL object
	 *
	 * @param url - The URL object to modify
	 * @param params - Query parameters to add
	 */
	private addQueryParams(url: URL, params?: Record<string, any>): void {
		if (!params) return

		// Transform query parameters from camelCase to snake_case
		const transformed = this.transformRequest(params)

		Object.entries(transformed).forEach(([key, value]) => {
			// Skip undefined and null values
			if (value === undefined || value === null) return

			// Handle arrays by adding multiple params with the same key
			if (Array.isArray(value)) {
				value.forEach(item => {
					url.searchParams.append(key, String(item))
				})
			} else {
				url.searchParams.set(key, String(value))
			}
		})
	}

	/**
	 * Generates a unique identifier for a request
	 * Used for request cancellation and caching
	 *
	 * @param path - The request path
	 * @param method - The HTTP method
	 * @param body - Optional request body for cache key generation
	 * @returns A unique request identifier
	 */
	private generateRequestId(path: string, method = 'GET', body?: string): string {
		const base = `${this.constructor.name}:${method}:${path}`
		// For POST/PUT/PATCH requests with body, include body hash in cache key
		if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
			// Simple hash of body for cache key
			const bodyHash = this.simpleHash(body)
			return `${base}:${bodyHash}`
		}
		return base
	}

	/**
	 * Generates a simple hash of a string for cache key generation
	 * Not cryptographically secure, just for cache differentiation
	 *
	 * @param str - String to hash
	 * @returns Hash string
	 */
	private simpleHash(str: string): string {
		let hash = 0
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i)
			hash = ((hash << 5) - hash) + char
			hash = hash & hash // Convert to 32bit integer
		}
		return hash.toString(36)
	}

	/**
	 * Handles error responses from the API
	 * Attempts to parse error details from the response body
	 *
	 * @param response - The error response
	 * @returns An AdapterError with normalized error information
	 */
	private async handleErrorResponse(response: Response): Promise<AdapterError> {
		let details: any = undefined
		let message = response.statusText

		try {
			// Try to parse error details from response body
			const errorData = await response.json()

			// Extract error message from various possible formats
			message = errorData.message ||
					 errorData.error ||
					 errorData.errors?.[0]?.message ||
					 response.statusText

			details = errorData
		} catch {
			// If response body is not JSON, use status text
		}

		// Use our error utility to create the appropriate error type
		return createErrorFromStatus(response.status, message, details).toJSON()
	}

	/**
	 * Gets data from cache if it exists and hasn't expired
	 *
	 * @param key - The cache key
	 * @returns The cached data or null if not found/expired
	 */
	private getFromCache(key: string): any | null {
		const entry = this.cache.get(key)
		if (!entry) return null

		// Check if cache has expired
		if (Date.now() > entry.expires) {
			this.cache.delete(key)
			return null
		}

		return entry.data
	}

	/**
	 * Stores data in cache with expiration time
	 *
	 * @param key - The cache key
	 * @param data - The data to cache
	 * @param ttl - Time to live in milliseconds
	 */
	private setCache(key: string, data: any, ttl: number): void {
		this.cache.set(key, {
			data,
			expires: Date.now() + ttl
		})
	}

	/**
	 * Clears the cache
	 *
	 * @param pattern - Optional pattern to match keys for selective clearing
	 */
	clearCache(pattern?: string): void {
		if (pattern) {
			// Clear only matching keys
			for (const key of this.cache.keys()) {
				if (key.includes(pattern)) {
					this.cache.delete(key)
				}
			}
		} else {
			// Clear all cache
			this.cache.clear()
		}
	}
}