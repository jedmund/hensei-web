/**
 * Type definitions for the adapter layer
 *
 * This module contains all the TypeScript interfaces and types used
 * throughout the adapter system. These types ensure type safety and
 * provide clear contracts for adapter implementations.
 *
 * @module adapters/types
 */

/**
 * Configuration options for adapter instances
 */
export interface AdapterOptions {
	/** Base URL for API requests. Defaults to the app's API base URL */
	baseURL?: string

	/** Default timeout for requests in milliseconds. Defaults to 30000 (30 seconds) */
	timeout?: number

	/** Number of retry attempts for failed requests. Defaults to 3 */
	retries?: number

	/** Default cache duration in milliseconds. Set to 0 to disable caching */
	cacheTime?: number

	/** Global error handler callback. Called when any request fails */
	onError?: (error: AdapterError) => void
}

/**
 * Options for individual HTTP requests
 * Extends the standard RequestInit interface with additional features
 */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
	/** Query parameters to append to the URL */
	params?: Record<string, any>

	/** Request timeout in milliseconds. Overrides the adapter's default timeout */
	timeout?: number

	/** Number of retry attempts for this specific request */
	retries?: number

	/** Cache duration for this request in milliseconds. Only applies to GET requests */
	cache?: number

	/** Request body. Can be any serializable value */
	body?: any
}

/**
 * Normalized error structure for all adapter errors
 * Provides consistent error handling across the application
 */
export interface AdapterError {
	/** Error name, always 'AdapterError' for identification */
	name: 'AdapterError'

	/** Normalized error code (e.g., 'NOT_FOUND', 'UNAUTHORIZED') */
	code: string

	/** HTTP status code if applicable, 0 otherwise */
	status: number

	/** Human-readable error message */
	message: string

	/** Additional error details from the API response */
	details?: any
}

/**
 * Generic paginated response structure
 * Used for endpoints that return paginated data
 */
export interface PaginatedResponse<T> {
	/** Array of items for the current page */
	items: T[]

	/** Total number of items across all pages */
	total: number

	/** Current page number (1-indexed) */
	page: number

	/** Total number of pages */
	totalPages: number

	/** Number of items per page */
	perPage: number

	/** Whether there are more pages available */
	hasMore: boolean

	/** Cursor or page number for the next page, if available */
	nextCursor?: string | number

	/** Cursor or page number for the previous page, if available */
	prevCursor?: string | number
}

/**
 * Base response wrapper for API responses
 * Some endpoints wrap their data in a standard structure
 */
export interface ApiResponse<T> {
	/** The actual data payload */
	data: T

	/** Metadata about the response */
	meta?: {
		/** Pagination information if applicable */
		pagination?: {
			page: number
			perPage: number
			total: number
			totalPages: number
		}

		/** Response timestamp */
		timestamp?: number

		/** API version */
		version?: string
	}

	/** Error information if the request failed */
	error?: {
		code: string
		message: string
		details?: any
	}
}

/**
 * Search filter options used across different search endpoints
 */
export interface SearchFilters {
	/** Filter by element IDs */
	element?: number[]

	/** Filter by rarity levels */
	rarity?: number[]

	/** Filter by primary proficiency (weapons and characters) */
	proficiency1?: number[]

	/** Filter by secondary proficiency (characters only) */
	proficiency2?: number[]

	/** Filter by series */
	series?: number[]

	/** Include extra/seasonal variants */
	extra?: boolean

	/** Filter summons with sub-aura */
	subaura?: boolean

	/** Filter special characters */
	special?: boolean

	/** Custom filters for specific use cases */
	[key: string]: any
}

/**
 * Parameters for search operations
 */
export interface SearchParams {
	/** The type of entity to search */
	type: 'weapon' | 'character' | 'summon'

	/** Search query string */
	query?: string

	/** Filters to apply to the search */
	filters?: SearchFilters

	/** Page number for pagination (1-indexed) */
	page?: number

	/** Number of items per page */
	perPage?: number

	/** Locale for localized content */
	locale?: 'en' | 'ja'

	/** Items to exclude from results (by ID) */
	exclude?: string[]

	/** AbortSignal for request cancellation */
	signal?: AbortSignal
}

/**
 * Unified search result structure
 */
export interface SearchResult<T = any> {
	/** Unique identifier */
	id: string

	/** Granblue Fantasy game ID */
	granblueId: string

	/** Item name (localized or string) */
	name: { en?: string; ja?: string } | string

	/** Display name (computed from name) */
	displayName?: string

	/** Element ID (0-6) */
	element?: number

	/** Rarity level */
	rarity?: number

	/** Primary proficiency (weapons) */
	proficiency?: number

	/** Series ID */
	series?: number

	/** URL to the item's image */
	imageUrl?: string

	/** Type of the search result */
	type: 'weapon' | 'character' | 'summon'

	/** The full entity data */
	data?: T
}

/**
 * Cache entry structure
 */
export interface CacheEntry<T = any> {
	/** The cached data */
	data: T

	/** Timestamp when the cache entry expires */
	expires: number

	/** Optional tags for cache invalidation */
	tags?: string[]
}

/**
 * Request deduplication entry
 */
export interface PendingRequest {
	/** The promise for the pending request */
	promise: Promise<any>

	/** AbortController for cancelling the request */
	controller: AbortController

	/** Timestamp when the request started */
	startTime: number
}

/**
 * Retry configuration for specific error types
 */
export interface RetryConfig {
	/** Maximum number of retry attempts */
	maxAttempts: number

	/** Base delay in milliseconds for exponential backoff */
	baseDelay: number

	/** Maximum delay in milliseconds */
	maxDelay: number

	/** Jitter factor (0-1) to randomize delays */
	jitter?: number

	/** Error codes that should trigger a retry */
	retryableCodes?: string[]

	/** HTTP status codes that should trigger a retry */
	retryableStatuses?: number[]
}

/**
 * Transformation options for request/response data
 */
export interface TransformOptions {
	/** Whether to transform snake_case to camelCase */
	transformCase?: boolean

	/** Whether to rename 'object' fields to entity names */
	renameObjectFields?: boolean

	/** Custom transformation function */
	customTransform?: (data: any) => any
}

/**
 * Resource state for Runed integration
 */
export interface ResourceState<T> {
	/** The current data */
	data: T | null

	/** Whether the resource is currently loading */
	loading: boolean

	/** Error if the resource failed to load */
	error: Error | null

	/** Whether the resource is being refreshed */
	refreshing: boolean

	/** Timestamp of the last successful fetch */
	lastFetch?: number
}

/**
 * Options for creating reactive resources with Runed
 */
export interface ResourceOptions<T> {
	/** Initial data value */
	initialData?: T

	/** Whether to fetch immediately on creation */
	immediate?: boolean

	/** Debounce delay for reactive updates */
	debounce?: number

	/** Cache time in milliseconds */
	cacheTime?: number

	/** Whether to keep previous data while fetching */
	keepPreviousData?: boolean

	/** Callback when data is fetched successfully */
	onSuccess?: (data: T) => void

	/** Callback when fetch fails */
	onError?: (error: Error) => void

	/** Dependencies that trigger refetch when changed */
	dependencies?: any[]
}