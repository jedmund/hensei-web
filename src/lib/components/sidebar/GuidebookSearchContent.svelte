
<script lang="ts">
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import { onDestroy } from 'svelte'
	import { searchQueries } from '$lib/api/queries/search.queries'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
	import { localizedName } from '$lib/utils/locale'
	import { getLocale } from '$lib/paraglide/runtime'
	import { getGuidebookImage } from '$lib/utils/images'
	import * as m from '$lib/paraglide/messages'
	import type { SearchResult } from '$lib/api/adapters/search.adapter'

	import Icon from '../Icon.svelte'
	import Input from '../ui/Input.svelte'
	import Button from '../ui/Button.svelte'

	interface Props {
		onSelect?: (item: SearchResult) => void
		position: number
	}

	let { onSelect, position }: Props = $props()

	// Search state
	let searchQuery = $state('')
	let debouncedSearchQuery = $state('')
	let debounceTimer: ReturnType<typeof setTimeout> | undefined
	let isComposing = $state(false)

	// Refs
	let sentinelEl = $state<HTMLElement>()

	// IME composition handlers
	function handleCompositionStart() {
		isComposing = true
	}

	function handleCompositionEnd() {
		setTimeout(() => {
			isComposing = false
		}, 50)
	}

	// Debounce search query changes
	$effect(() => {
		const query = searchQuery

		if (debounceTimer) clearTimeout(debounceTimer)
		if (isComposing) return

		debounceTimer = setTimeout(() => {
			debouncedSearchQuery = query
		}, 300)

		return () => {
			if (debounceTimer) clearTimeout(debounceTimer)
		}
	})

	// --- Query ---

	const searchQueryResult = createInfiniteQuery(() => {
		const locale = getLocale() as 'en' | 'ja'
		return searchQueries.guidebooks(debouncedSearchQuery, locale)
	})

	const searchResults = $derived(
		searchQueryResult.data?.pages.flatMap((page) => page.results) ?? []
	)

	// --- Infinite scroll ---

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const loader = useInfiniteLoader(
		() => searchQueryResult as any,
		() => sentinelEl,
		{ rootMargin: '200px' }
	)

	onDestroy(() => loader.destroy())

	// --- Computed states ---

	const isEmpty = $derived(
		searchResults.length === 0 && !searchQueryResult.isLoading && !searchQueryResult.isError
	)

	function handleItemClick(item: SearchResult) {
		onSelect?.(item)
	}

	function getItemName(result: SearchResult): string {
		const name = result.name
		if (typeof name === 'string') return name
		return localizedName(name) || 'Unknown'
	}
</script>

<div class="search-content">
	<div class="controls">
		<div class="search-section">
			<Input
				bind:value={searchQuery}
				type="text"
				placeholder={m.search_placeholder()}
				leftIcon="search"
				contained
				fullWidth
				class="search-input"
				oncompositionstart={handleCompositionStart}
				oncompositionend={handleCompositionEnd}
			/>
		</div>
	</div>

	<div class="results-section">
		{#if searchQueryResult.isLoading}
			<div class="loading">
				<Icon name="loader-2" size={24} />
				<span>{m.search_searching()}</span>
			</div>
		{:else if searchQueryResult.isError}
			<div class="error-state">
				<Icon name="alert-circle" size={24} />
				<p>{searchQueryResult.error?.message || m.search_failed()}</p>
				<Button size="small" onclick={() => searchQueryResult.refetch()}>{m.retry()}</Button>
			</div>
		{:else if searchResults.length > 0}
			<ul class="results-list">
				{#each searchResults as item (item.id)}
					<li class="result-item">
						<button
							class="result-button"
							onclick={() => handleItemClick(item)}
						>
							<img
								src={getGuidebookImage(item.granblueId)}
								alt={getItemName(item)}
								class="result-image"
								loading="lazy"
							/>
							<div class="result-info">
								<span class="result-name">{getItemName(item)}</span>
							</div>
						</button>
					</li>
				{/each}
			</ul>

			<div
				class="load-more-sentinel"
				bind:this={sentinelEl}
				class:hidden={!searchQueryResult.hasNextPage}
			></div>

			{#if searchQueryResult.isFetchingNextPage}
				<div class="loading-more">
					<Icon name="loader-2" size={20} />
					<span>{m.search_loading_more()}</span>
				</div>
			{/if}
		{:else if isEmpty}
			<div class="no-results">
				{#if searchQuery.length > 0}
					{m.search_no_results()}
				{:else}
					{m.search_start_typing()}
				{/if}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.search-content {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 60px);
		overflow: hidden;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: $unit;
		padding: 0 $unit-2x $unit;
		flex-shrink: 0;
		border-bottom: 1px solid var(--border-primary);

		:global(.search-input) {
			border-radius: $card-corner;
		}
	}

	.results-section {
		flex: 1;
		overflow-y: auto;
		padding: $unit $unit-2x;
	}

	.results-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.result-item {
		margin-bottom: $unit-half;
	}

	.result-button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit;
		border: none;
		border-radius: $input-corner;
		background: transparent;
		cursor: pointer;
		transition: background-color 0.15s ease-out;
		text-align: left;

		&:hover {
			background: var(--bg-tertiary);
		}

		&:active {
			transform: scale(0.99);
		}
	}

	.result-image {
		width: 48px;
		height: auto;
		border-radius: $item-corner-small;
		border: 1px solid var(--border-primary);
		flex-shrink: 0;
	}

	.result-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		min-width: 0;
	}

	.result-name {
		font-size: $font-regular;
		color: var(--text-primary);
	}

	.loading,
	.loading-more {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $unit;
		padding: $unit-3x;
		color: var(--text-secondary);
		font-size: $font-small;

		:global(svg) {
			animation: spin 1s linear infinite;
		}
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit;
		padding: $unit-3x;
		color: var(--text-secondary);
		text-align: center;
	}

	.no-results {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: $unit-3x;
		color: var(--text-tertiary);
		font-size: $font-small;
		text-align: center;
	}

	.load-more-sentinel {
		height: 1px;

		&.hidden {
			display: none;
		}
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
