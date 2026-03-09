/**
 * Infinite Scroll State Management
 *
 * Inspired by svelte-infinite (https://github.com/ndom91/svelte-infinite)
 * Provides state gating to prevent rapid-fire page fetches that can crash Svelte's block tracking.
 *
 * @module stores/loaderState
 */

import type { CreateInfiniteQueryResult } from '@tanstack/svelte-query'
import { IsInViewport } from 'runed'

export const STATUS = {
	READY: 'READY',
	LOADING: 'LOADING',
	COMPLETE: 'COMPLETE',
	ERROR: 'ERROR'
} as const

export type LoaderStatus = (typeof STATUS)[keyof typeof STATUS]

/**
 * Simple state machine for infinite scroll loading.
 *
 * States:
 * - READY: Can accept a new load request
 * - LOADING: Currently fetching data
 * - COMPLETE: No more data to load
 * - ERROR: Last load failed (allows retry)
 *
 * @example
 * ```typescript
 * const loaderState = new LoaderState()
 *
 * // Before loading
 * if (loaderState.status === STATUS.READY) {
 *   loaderState.status = STATUS.LOADING
 *   await fetchData()
 *   loaderState.loaded()
 * }
 * ```
 */
export class LoaderState {
	isFirstLoad = $state(true)
	status = $state<LoaderStatus>(STATUS.READY)

	/**
	 * Call after a successful load to allow the next fetch.
	 */
	loaded = () => {
		if (this.isFirstLoad) this.isFirstLoad = false
		this.status = STATUS.READY
	}

	/**
	 * Call when there's no more data to load.
	 */
	complete = () => {
		if (this.isFirstLoad) this.isFirstLoad = false
		this.status = STATUS.COMPLETE
	}

	/**
	 * Call when a load fails.
	 */
	error = () => {
		this.status = STATUS.ERROR
	}

	/**
	 * Reset to initial state (e.g., when filters change).
	 */
	reset = () => {
		this.isFirstLoad = true
		this.status = STATUS.READY
	}
}

/**
 * Detects infinite loops and triggers cooldown.
 *
 * If too many load attempts happen in a short period, assumes something is wrong
 * and pauses loading to prevent browser crashes.
 *
 * @example
 * ```typescript
 * const loopTracker = new LoopTracker()
 *
 * // After each successful load
 * loopTracker.track()
 *
 * // Check before loading
 * if (!loopTracker.coolingOff) {
 *   await fetchData()
 * }
 *
 * // Cleanup on component destroy
 * onDestroy(() => loopTracker.destroy())
 * ```
 */
export class LoopTracker {
	coolingOff = $state(false)
	#coolingOffTimer: ReturnType<typeof setTimeout> | null = null
	#timer: ReturnType<typeof setTimeout> | null = null
	#count = 0

	constructor(
		private loopMaxCalls = 5,
		private loopDetectionTimeout = 2000,
		private loopCooldown = 3000
	) {}

	/**
	 * Call after each successful load to track frequency.
	 */
	track() {
		this.#count += 1

		// Reset timer - if no calls in loopDetectionTimeout, reset count
		if (this.#timer) clearTimeout(this.#timer)
		this.#timer = setTimeout(() => {
			this.#count = 0
		}, this.loopDetectionTimeout)

		// If too many calls, start cooldown
		if (this.#count >= this.loopMaxCalls) {
			if (import.meta.env.DEV) console.warn(`[LoopTracker] Too many load attempts (${this.#count}), cooling off...`)
			this.coolingOff = true
			this.#coolingOffTimer = setTimeout(() => {
				this.coolingOff = false
				this.#count = 0
			}, this.loopCooldown)
		}
	}

	/**
	 * Clean up timers. Call in onDestroy.
	 */
	destroy() {
		if (this.#timer) clearTimeout(this.#timer)
		if (this.#coolingOffTimer) clearTimeout(this.#coolingOffTimer)
	}
}

interface InfiniteLoaderOptions {
	/** Root margin for intersection observer (default: '100px') */
	rootMargin?: string
}

/**
 * Composable for state-gated infinite scroll with TanStack Query.
 *
 * Encapsulates the LoaderState, LoopTracker, intersection observer, and all
 * reactive effects to reduce duplication across collection pages.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
 *
 *   let sentinelEl = $state<HTMLElement>()
 *
 *   const collectionQuery = createInfiniteQuery(...)
 *   const loader = useInfiniteLoader(
 *     () => collectionQuery,
 *     () => sentinelEl
 *   )
 *
 *   // Cleanup
 *   onDestroy(() => loader.destroy())
 * </script>
 *
 * <div bind:this={sentinelEl}></div>
 * ```
 */
export function useInfiniteLoader<TData, TError>(
	queryFn: () => CreateInfiniteQueryResult<TData, TError>,
	sentinelFn: () => HTMLElement | undefined,
	options?: InfiniteLoaderOptions
) {
	const state = new LoaderState()
	const loopTracker = new LoopTracker()

	// Set up intersection observer for the sentinel element
	const inViewport = new IsInViewport(sentinelFn, {
		rootMargin: options?.rootMargin ?? '100px'
	})

	// Track whether the sentinel has left the viewport since the last load
	// This prevents the $effect from immediately triggering another load
	// when the sentinel is still in viewport after a page loads
	let waitingForSentinelExit = $state(false)

	// Trigger load when sentinel enters viewport and we're ready
	$effect(() => {
		if (inViewport.current && state.status === STATUS.READY && !waitingForSentinelExit) {
			loadMore()
		}
	})

	// Clear the waiting flag when sentinel leaves viewport
	$effect(() => {
		if (!inViewport.current && waitingForSentinelExit) {
			if (import.meta.env.DEV) console.log(`[InfiniteLoader] ${new Date().toISOString()} Sentinel exited viewport, ready for next trigger`)
			waitingForSentinelExit = false
		}
	})

	/**
	 * Attempt to load the next page.
	 * Respects state gating and loop detection.
	 */
	async function loadMore() {
		const query = queryFn()

		if (import.meta.env.DEV) console.log(`[InfiniteLoader] ${new Date().toISOString()} loadMore called, status=${state.status}, waitingForExit=${waitingForSentinelExit}`)

		// Guard: Only proceed if READY or ERROR (for retry)
		if (
			state.status === STATUS.COMPLETE ||
			(state.status !== STATUS.READY && state.status !== STATUS.ERROR)
		) {
			if (import.meta.env.DEV) console.log(`[InfiniteLoader] ${new Date().toISOString()} Skipped - status is ${state.status}`)
			return
		}

		// Guard: Wait for sentinel to leave viewport after a load before allowing next
		if (waitingForSentinelExit) {
			if (import.meta.env.DEV) console.log(`[InfiniteLoader] ${new Date().toISOString()} Skipped - waiting for sentinel to leave viewport`)
			return
		}

		// Skip if cooling off from loop detection
		if (loopTracker.coolingOff) {
			if (import.meta.env.DEV) console.log(`[InfiniteLoader] ${new Date().toISOString()} Skipped - cooling off`)
			return
		}

		// Check if there's more data to load
		if (!query.hasNextPage) {
			if (import.meta.env.DEV) console.log(`[InfiniteLoader] ${new Date().toISOString()} No more pages available`)
			state.complete()
			return
		}

		state.status = STATUS.LOADING
		if (import.meta.env.DEV) console.log(`[InfiniteLoader] ${new Date().toISOString()} Status set to LOADING, starting fetch...`)

		const startTime = performance.now()

		try {
			// Await the fetch - blocks until complete
			await query.fetchNextPage()

			// Log page load
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const pageCount = ((query.data as any)?.pages?.length ?? 0)
			const elapsed = (performance.now() - startTime).toFixed(0)
			if (import.meta.env.DEV) console.log(`[InfiniteLoader] ${new Date().toISOString()} Loaded page ${pageCount} (${elapsed}ms)`)

			// Track AFTER successful load (svelte-infinite pattern)
			loopTracker.track()

			// Auto-transition to READY or COMPLETE
			if (state.status === STATUS.LOADING) {
				if (!query.hasNextPage) {
					if (import.meta.env.DEV) console.log(`[InfiniteLoader] ${new Date().toISOString()} Complete - no more pages`)
					state.complete()
				} else {
					// Set flag to wait for sentinel to leave viewport before next load
					// This prevents immediate re-triggering when sentinel is still visible
					waitingForSentinelExit = true
					if (import.meta.env.DEV) console.log(`[InfiniteLoader] ${new Date().toISOString()} Ready for next page (waiting for sentinel exit)`)
					state.loaded()
				}
			}
		} catch (error) {
			if (import.meta.env.DEV) console.error(`[InfiniteLoader] ${new Date().toISOString()} Failed to load next page:`, error)
			state.error()
		}
	}

	/**
	 * Reset the loader state (e.g., when filters change).
	 */
	function reset() {
		state.reset()
		waitingForSentinelExit = false
	}

	/**
	 * Clean up timers. Call in onDestroy.
	 */
	function destroy() {
		loopTracker.destroy()
	}

	return {
		state,
		loopTracker,
		reset,
		destroy
	}
}
