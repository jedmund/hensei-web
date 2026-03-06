<script lang="ts">
	import type { CreateInfiniteQueryResult, InfiniteData } from '@tanstack/svelte-query'
	import type { Snippet } from 'svelte'
	import { IsInViewport } from 'runed'

	interface PageData {
		results: unknown[]
		page: number
		totalPages: number
	}

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		query: CreateInfiniteQueryResult<InfiniteData<PageData, any>, Error>
		children: Snippet<[unknown[]]>
		loadingSnippet?: Snippet
		loadingMoreSnippet?: Snippet
		errorSnippet?: Snippet<[Error]>
		emptySnippet?: Snippet
		endSnippet?: Snippet
		class?: string
		threshold?: number
	}

	let {
		query,
		children,
		loadingSnippet,
		loadingMoreSnippet,
		errorSnippet,
		emptySnippet,
		endSnippet,
		class: className = '',
		threshold = 200
	}: Props = $props()

	// Sentinel element for intersection observation
	let sentinel = $state<HTMLElement>()

	// Use runed's IsInViewport for viewport detection
	const inViewport = new IsInViewport(() => sentinel, {
		rootMargin: `${threshold}px`
	})

	// Auto-fetch next page when sentinel is visible
	$effect(() => {
		if (
			inViewport.current &&
			query.hasNextPage &&
			!query.isFetchingNextPage &&
			!query.isLoading
		) {
			query.fetchNextPage()
		}
	})

	// Flatten all pages into a single items array
	const items = $derived(query.data?.pages.flatMap((page) => page.results) ?? [])

	// Computed states
	const isEmpty = $derived(items.length === 0 && !query.isLoading && !query.isError)
	const isLoadingInitial = $derived(query.isLoading && !query.isFetchingNextPage)
	const showSentinel = $derived(
		!query.isLoading && query.hasNextPage && items.length > 0
	)
	const showEnd = $derived(
		!query.hasNextPage && !isEmpty && !query.isLoading && items.length > 0
	)

	// Accessibility announcements
	function announceToScreenReader(message: string) {
		const announcement = document.createElement('div')
		announcement.setAttribute('role', 'status')
		announcement.setAttribute('aria-live', 'polite')
		announcement.setAttribute('aria-atomic', 'true')
		announcement.className = 'sr-only'
		announcement.textContent = message
		document.body.appendChild(announcement)
		setTimeout(() => announcement.remove(), 1000)
	}

	$effect(() => {
		if (query.isFetchingNextPage) {
			announceToScreenReader('Loading more items...')
		}
	})

	$effect(() => {
		if (!query.hasNextPage && items.length > 0) {
			announceToScreenReader('All items have been loaded')
		}
	})
</script>

<div class="infinite-scroll-container {className}">
	<!-- Main content -->
	{#if !isLoadingInitial}
		{@render children(items)}
	{/if}

	<!-- Loading indicator for initial load -->
	{#if isLoadingInitial}
		{#if loadingSnippet}
			{@render loadingSnippet()}
		{:else}
			<div class="loading-initial">
				<span class="spinner" aria-hidden="true"></span>
				<span>Loading...</span>
			</div>
		{/if}
	{/if}

	<!-- Empty state -->
	{#if isEmpty}
		{#if emptySnippet}
			{@render emptySnippet()}
		{:else}
			<div class="empty-state">
				<p>No items found</p>
			</div>
		{/if}
	{/if}

	<!-- Sentinel element for intersection observer -->
	{#if showSentinel}
		<div bind:this={sentinel} class="sentinel" aria-hidden="true"></div>
	{/if}

	<!-- Loading more indicator -->
	{#if query.isFetchingNextPage}
		{#if loadingMoreSnippet}
			{@render loadingMoreSnippet()}
		{:else}
			<div class="loading-more" aria-busy="true">
				<span class="spinner" aria-hidden="true"></span>
				<span>Loading more...</span>
			</div>
		{/if}
	{/if}

	<!-- Error state with retry -->
	{#if query.isError && !query.isFetchingNextPage}
		{#if errorSnippet}
			{@render errorSnippet(query.error)}
		{:else}
			<div class="error-state" role="alert">
				<p>Failed to load items</p>
				<button class="retry-button" onclick={() => query.refetch()} aria-label="Retry loading items">
					Try Again
				</button>
			</div>
		{/if}
	{/if}

	<!-- End of list indicator -->
	{#if showEnd}
		{#if endSnippet}
			{@render endSnippet()}
		{:else}
			<div class="end-state">
				<p>No more items to load</p>
			</div>
		{/if}
	{/if}

	<!-- Fallback load more button for accessibility -->
	{#if query.hasNextPage && !query.isFetchingNextPage && !query.isLoading && items.length > 0}
		<button
			class="load-more-fallback"
			onclick={() => query.fetchNextPage()}
			aria-label="Load more items"
		>
			Load More
		</button>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/layout' as *;

	.infinite-scroll-container {
		position: relative;
		width: 100%;
	}

	.sentinel {
		height: 1px;
		margin-top: -200px;
		pointer-events: none;
	}

	.loading-initial,
	.loading-more,
	.error-state,
	.empty-state,
	.end-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: $unit-4x;
		text-align: center;
		gap: $unit;
	}

	.loading-initial,
	.loading-more {
		color: var(--text-secondary);
	}

	.error-state {
		color: var(--text-error, #dc2626);

		p {
			margin: 0 0 $unit 0;
		}
	}

	.empty-state,
	.end-state {
		color: var(--text-tertiary);

		p {
			margin: 0;
		}
	}

	.spinner {
		display: inline-block;
		width: 24px;
		height: 24px;
		border: 3px solid rgba(0, 0, 0, 0.1);
		border-left-color: var(--primary-color, #3366ff);
		border-radius: 50%;
		animation: spin 1s linear infinite;

		@media (prefers-reduced-motion: reduce) {
			animation: none;
			opacity: 0.8;
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.retry-button {
		padding: $unit $unit-2x;
		background: var(--button-bg, #3366ff);
		color: var(--button-text, white);
		border: none;
		border-radius: $item-corner-small;
		cursor: pointer;
		font-size: inherit;
		font-family: inherit;
		transition: opacity 0.2s;

		&:hover {
			opacity: 0.9;
		}

		&:active {
			transform: translateY(1px);
		}
	}

	.load-more-fallback {
		display: block;
		margin: $unit-2x auto;
		padding: $unit $unit-2x;
		background: var(--button-bg, #f3f4f6);
		color: var(--button-text, #1f2937);
		border: 1px solid var(--button-border, #e5e7eb);
		border-radius: $item-corner-small;
		cursor: pointer;
		font-size: inherit;
		font-family: inherit;
		transition: all 0.2s;

		// Only show for keyboard/screen reader users by default
		&:not(:focus) {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border: 0;
		}

		&:hover {
			background: var(--button-bg-hover, #e5e7eb);
		}
	}

	// Screen reader only content
	:global(.sr-only) {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
