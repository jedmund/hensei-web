<script lang="ts">
	import type { InfiniteScrollResource } from '$lib/api/adapters/resources/infiniteScroll.resource.svelte'
	import type { Snippet } from 'svelte'

	interface Props {
		resource: InfiniteScrollResource<any>
		children: Snippet
		loadingSnippet?: Snippet
		loadingMoreSnippet?: Snippet
		errorSnippet?: Snippet<[Error]>
		emptySnippet?: Snippet
		endSnippet?: Snippet
		class?: string
	}

	const {
		resource,
		children,
		loadingSnippet,
		loadingMoreSnippet,
		errorSnippet,
		emptySnippet,
		endSnippet,
		class: className = ''
	}: Props = $props()

	// Bind sentinel element
	let sentinel: HTMLElement

	$effect(() => {
		if (sentinel && resource) {
			resource.bindSentinel(sentinel)
		}
		// Note: We intentionally don't destroy the resource here.
		// The parent component owns the resource lifecycle and calls destroy()
		// when appropriate (e.g., when filters change and a new resource is created).
	})

	// Accessibility: Announce new content to screen readers
	$effect(() => {
		if (resource.loadingMore) {
			announceToScreenReader('Loading more items...')
		}
	})

	$effect(() => {
		if (!resource.hasMore && resource.items.length > 0) {
			announceToScreenReader('All items have been loaded')
		}
	})

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

	function handleRetry() {
		resource.retry()
	}

	function handleLoadMore() {
		resource.loadMore()
	}
</script>

<div class="infinite-scroll-container {className}">
	<!-- Main content -->
	{#if !resource.loading}
		{@render children()}
	{/if}

	<!-- Loading indicator for initial load -->
	{#if resource.loading}
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
	{#if resource.isEmpty && !resource.loading}
		{#if emptySnippet}
			{@render emptySnippet()}
		{:else}
			<div class="empty-state">
				<p>No items found</p>
			</div>
		{/if}
	{/if}

	<!-- Sentinel element for intersection observer -->
	{#if !resource.loading && resource.hasMore && resource.items.length > 0}
		<div
			bind:this={sentinel}
			class="sentinel"
			aria-hidden="true"
		></div>
	{/if}

	<!-- Loading more indicator -->
	{#if resource.loadingMore}
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
	{#if resource.error && !resource.loadingMore}
		{#if errorSnippet}
			{@render errorSnippet(resource.error)}
		{:else}
			<div class="error-state" role="alert">
				<p>Failed to load more items</p>
				<button
					class="retry-button"
					onclick={handleRetry}
					aria-label="Retry loading items"
				>
					Try Again
				</button>
			</div>
		{/if}
	{/if}

	<!-- End of list indicator -->
	{#if !resource.hasMore && !resource.isEmpty && !resource.loading}
		{#if endSnippet}
			{@render endSnippet()}
		{:else}
			<div class="end-state">
				<p>No more items to load</p>
			</div>
		{/if}
	{/if}

	<!-- Fallback load more button for accessibility -->
	{#if resource.hasMore && !resource.loadingMore && !resource.loading && resource.items.length > 0}
		<button
			class="load-more-fallback"
			onclick={handleLoadMore}
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
		margin-top: -200px; // Trigger before reaching actual end
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

		// Respect reduced motion preference
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
		border-radius: 4px;
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
		border-radius: 4px;
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
	.sr-only {
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