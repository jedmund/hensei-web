/**
 * Infinite Scroll Resource using Svelte 5 Runes and Runed
 *
 * Provides reactive state management for infinite scrolling with
 * automatic loading states, error handling, and viewport detection.
 *
 * @module adapters/resources/infiniteScroll
 */

import { IsInViewport, watch, useDebounce } from 'runed'
import type { AdapterError, PaginatedResponse } from '../types'

/**
 * Infinite scroll configuration options
 */
export interface InfiniteScrollOptions<T> {
	/** Function to fetch data for a given page */
	fetcher: (page: number, signal?: AbortSignal) => Promise<PaginatedResponse<T>>
	/** Initial data from SSR */
	initialData?: T[] | undefined
	/** Initial page number */
	initialPage?: number | undefined
	/** Initial total pages */
	initialTotalPages?: number | undefined
	/** Initial total count */
	initialTotal?: number | undefined
	/** Number of items per page */
	pageSize?: number | undefined
	/** Pixels before viewport edge to trigger load */
	threshold?: number | undefined
	/** Debounce delay in milliseconds */
	debounceMs?: number | undefined
	/** Maximum items to keep in memory (for performance) */
	maxItems?: number | undefined
	/** Enable debug logging */
	debug?: boolean | undefined
}

/**
 * Creates a reactive infinite scroll resource for paginated data
 *
 * @example
 * ```svelte
 * <script>
 * import { createInfiniteScrollResource } from '$lib/api/adapters/resources'
 * import { partyAdapter } from '$lib/api/adapters'
 *
 * const resource = createInfiniteScrollResource({
 *   fetcher: (page) => partyAdapter.list({ page }),
 *   threshold: 300,
 *   debounceMs: 200
 * })
 * </script>
 *
 * <InfiniteScroll {resource}>
 *   <ExploreGrid items={resource.items} />
 * </InfiniteScroll>
 * ```
 */
export class InfiniteScrollResource<T> {
	// Reactive state
	items = $state<T[]>([])
	page = $state(1)
	totalPages = $state<number | undefined>()
	total = $state<number | undefined>()
	loading = $state(false)
	loadingMore = $state(false)
	error = $state<AdapterError | undefined>()

	// Sentinel element for intersection detection
	sentinelElement = $state<HTMLElement | undefined>()

	// Viewport detection using Runed
	private inViewport: IsInViewport | undefined

	// Configuration
	private fetcher: InfiniteScrollOptions<T>['fetcher']
	private threshold: number
	private maxItems: number | undefined
	private debug: boolean
	private debouncedLoadMore: ((force?: boolean) => void) | undefined

	// Abort controller for cancellation
	private abortController?: AbortController

	// Track if we've initialized from SSR data
	private initialized = false

	constructor(options: InfiniteScrollOptions<T>) {
		this.fetcher = options.fetcher
		this.threshold = options.threshold ?? 200
		this.maxItems = options.maxItems
		this.debug = options.debug ?? false

		// Initialize with SSR data if provided
		if (options.initialData) {
			this.items = options.initialData
			this.page = options.initialPage ?? 1
			this.totalPages = options.initialTotalPages
			this.total = options.initialTotal
			this.initialized = true
		}

		// Create debounced load function if specified
		if (options.debounceMs) {
			this.debouncedLoadMore = useDebounce(
				(force?: boolean) => this.loadMore(force),
				() => options.debounceMs!
			)
		}

		this.log('InfiniteScrollResource initialized', {
			items: this.items.length,
			page: this.page,
			totalPages: this.totalPages
		})
	}

	// Computed properties
	get hasMore(): boolean {
		return this.totalPages === undefined || this.page < this.totalPages
	}

	get isEmpty(): boolean {
		return this.items.length === 0 && !this.loading
	}

	get isLoading(): boolean {
		return this.loading || this.loadingMore
	}

	/**
	 * Initialize viewport detection after sentinel is bound
	 */
	private initViewportDetection() {
		if (this.inViewport) return

		this.inViewport = new IsInViewport(
			() => this.sentinelElement,
			{ rootMargin: `${this.threshold}px` }
		)

		// Watch for visibility changes
		watch(
			() => this.inViewport?.current,
			(isVisible) => {
				if (isVisible && !this.loading && !this.loadingMore && this.hasMore) {
					this.log('Sentinel visible, triggering load')
					if (this.debouncedLoadMore) {
						this.debouncedLoadMore()
					} else {
						this.loadMore()
					}
				}
			}
		)
	}

	/**
	 * Load initial data or reset
	 */
	async load() {
		this.reset()
		this.loading = true
		this.error = undefined

		this.log('Loading initial data')

		try {
			const response = await this.fetcher(1)
			this.items = response.results
			this.page = response.page
			this.totalPages = response.totalPages
			this.total = response.total
			this.initialized = true

			this.log('Initial data loaded', {
				items: this.items.length,
				totalPages: this.totalPages
			})
		} catch (err) {
			this.error = err as AdapterError
			this.log('Error loading initial data', err)
		} finally {
			this.loading = false
		}
	}

	/**
	 * Load next page
	 */
	async loadMore(force = false) {
		// Skip if already loading or no more pages (unless forced)
		if (!force && (!this.hasMore || this.loadingMore || this.loading)) {
			this.log('Skipping loadMore', {
				hasMore: this.hasMore,
				loadingMore: this.loadingMore,
				loading: this.loading
			})
			return
		}

		this.loadingMore = true
		this.error = undefined

		// Cancel previous request if any
		this.abortController?.abort()
		this.abortController = new AbortController()

		const nextPage = this.page + 1
		this.log(`Loading page ${nextPage}`)

		try {
			const response = await this.fetcher(nextPage, this.abortController.signal)
			this.log('API response:', response)

			// Append new items
			this.items = [...this.items, ...response.results]

			// Trim items if max limit is set
			if (this.maxItems && this.items.length > this.maxItems) {
				const trimmed = this.items.length - this.maxItems
				this.items = this.items.slice(-this.maxItems)
				this.log(`Trimmed ${trimmed} items to stay within maxItems limit`)
			}

			this.page = response.page
			this.totalPages = response.totalPages
			this.total = response.total

			this.log(`Page ${nextPage} loaded`, {
				newItems: response.results.length,
				totalItems: this.items.length,
				hasMore: this.hasMore
			})
		} catch (err: any) {
			if (err.name !== 'AbortError') {
				this.error = err as AdapterError
				this.log('Error loading more', err)
			} else {
				this.log('Request aborted')
			}
		} finally {
			this.loadingMore = false
			if (this.abortController) {
				this.abortController = undefined
			}
		}
	}

	/**
	 * Initialize from SSR data (for client-side hydration)
	 */
	initFromSSR(data: {
		items: T[]
		page: number
		totalPages?: number
		total?: number
	}) {
		if (this.initialized) return

		this.items = data.items
		this.page = data.page
		this.totalPages = data.totalPages
		this.total = data.total
		this.initialized = true

		this.log('Initialized from SSR', {
			items: this.items.length,
			page: this.page,
			totalPages: this.totalPages
		})
	}

	/**
	 * Manual trigger for load more (fallback button)
	 */
	async retry() {
		if (this.error) {
			this.log('Retrying after error')
			await this.loadMore(true)
		}
	}

	/**
	 * Reset to initial state
	 */
	reset() {
		this.items = []
		this.page = 0
		this.totalPages = undefined
		this.total = undefined
		this.loading = false
		this.loadingMore = false
		this.error = undefined
		this.initialized = false
		this.abortController?.abort()
		this.log('Reset to initial state')
	}

	/**
	 * Bind sentinel element
	 */
	bindSentinel(element: HTMLElement) {
		this.sentinelElement = element
		this.initViewportDetection()
		this.log('Sentinel element bound')
	}

	/**
	 * Cleanup
	 */
	destroy() {
		this.abortController?.abort()
		// IsInViewport doesn't have a stop method - it cleans up automatically
		this.log('Destroyed')
	}

	/**
	 * Debug logging
	 */
	private log(message: string, data?: any) {
		if (this.debug) {
			console.log(`[InfiniteScroll] ${message}`, data ?? '')
		}
	}
}

/**
 * Factory function for creating infinite scroll resources
 */
export function createInfiniteScrollResource<T>(
	options: InfiniteScrollOptions<T>
): InfiniteScrollResource<T> {
	return new InfiniteScrollResource(options)
}