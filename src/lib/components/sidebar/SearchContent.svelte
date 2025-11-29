<svelte:options runes={true} />

<script lang="ts">
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import type { SearchResult } from '$lib/api/adapters/search.adapter'
	import { searchQueries, type SearchFilters } from '$lib/api/queries/search.queries'
	import Button from '../ui/Button.svelte'
	import Icon from '../Icon.svelte'
	import { IsInViewport } from 'runed'
	import { getCharacterImage, getWeaponImage, getSummonImage } from '$lib/features/database/detail/image'

	interface Props {
		type: 'weapon' | 'character' | 'summon'
		onAddItems?: (items: SearchResult[]) => void
		canAddMore?: boolean
	}

	let {
		type = 'weapon',
		onAddItems = () => {},
		canAddMore = true
	}: Props = $props()

	// Search state (local UI state)
	let searchQuery = $state('')
	let debouncedSearchQuery = $state('')
	let debounceTimer: ReturnType<typeof setTimeout> | undefined

	// Filter state
	let elementFilters = $state<number[]>([])
	let rarityFilters = $state<number[]>([])
	let proficiencyFilters = $state<number[]>([])

	// Refs
	let searchInput: HTMLInputElement
	let sentinelEl = $state<HTMLElement>()

	// Constants
	const elements = [
		{ value: 0, label: 'Null', color: 'var(--grey-50)' },
		{ value: 1, label: 'Wind', color: 'var(--wind-bg)' },
		{ value: 2, label: 'Fire', color: 'var(--fire-bg)' },
		{ value: 3, label: 'Water', color: 'var(--water-bg)' },
		{ value: 4, label: 'Earth', color: 'var(--earth-bg)' },
		{ value: 5, label: 'Dark', color: 'var(--dark-bg)' },
		{ value: 6, label: 'Light', color: 'var(--light-bg)' }
	]

	const rarities = [
		{ value: 1, label: 'R' },
		{ value: 2, label: 'SR' },
		{ value: 3, label: 'SSR' }
	]

	const proficiencies = [
		{ value: 1, label: 'Sabre' },
		{ value: 2, label: 'Dagger' },
		{ value: 3, label: 'Spear' },
		{ value: 4, label: 'Axe' },
		{ value: 5, label: 'Staff' },
		{ value: 6, label: 'Gun' },
		{ value: 7, label: 'Melee' },
		{ value: 8, label: 'Bow' },
		{ value: 9, label: 'Harp' },
		{ value: 10, label: 'Katana' }
	]

	// Debounce search query changes
	$effect(() => {
		const query = searchQuery

		if (debounceTimer) {
			clearTimeout(debounceTimer)
		}

		debounceTimer = setTimeout(() => {
			debouncedSearchQuery = query
		}, 300)

		return () => {
			if (debounceTimer) {
				clearTimeout(debounceTimer)
			}
		}
	})

	// Build filters object for query
	const filters = $derived<SearchFilters>({
		element: elementFilters.length > 0 ? elementFilters : undefined,
		rarity: rarityFilters.length > 0 ? rarityFilters : undefined,
		proficiency: type === 'weapon' && proficiencyFilters.length > 0 ? proficiencyFilters : undefined
	})

	// TanStack Query v6: Use createInfiniteQuery with thunk pattern for reactivity
	// Query automatically updates when type, debouncedSearchQuery, or filters change
	// Note: Type assertion needed because different search types have different query keys
	// but share the same SearchPageResult structure
	const searchQueryResult = createInfiniteQuery(() => {
		const query = debouncedSearchQuery
		const currentFilters = filters

		// Select the appropriate query based on type
		// All query types return the same SearchPageResult structure
		switch (type) {
			case 'weapon':
				return searchQueries.weapons(query, currentFilters)
			case 'character':
				return searchQueries.characters(query, currentFilters) as unknown as ReturnType<typeof searchQueries.weapons>
			case 'summon':
				return searchQueries.summons(query, currentFilters) as unknown as ReturnType<typeof searchQueries.weapons>
		}
	})

	// Flatten all pages into a single items array
	const rawResults = $derived(
		searchQueryResult.data?.pages.flatMap((page) => page.results) ?? []
	)

	// Deduplicate by id - needed because the API may return the same item across pages
	// (e.g., due to items being added/removed between page fetches)
	const searchResults = $derived(
		Array.from(new Map(rawResults.map((item) => [item.id, item])).values())
	)

	// Use runed's IsInViewport for viewport detection
	const inViewport = new IsInViewport(() => sentinelEl, {
		rootMargin: '200px'
	})

	// Auto-fetch next page when sentinel is visible
	$effect(() => {
		if (
			inViewport.current &&
			searchQueryResult.hasNextPage &&
			!searchQueryResult.isFetchingNextPage &&
			!searchQueryResult.isLoading
		) {
			searchQueryResult.fetchNextPage()
		}
	})

	// Computed states
	const isEmpty = $derived(
		searchResults.length === 0 && !searchQueryResult.isLoading && !searchQueryResult.isError
	)
	const showSentinel = $derived(
		!searchQueryResult.isLoading && searchQueryResult.hasNextPage && searchResults.length > 0
	)

	// Focus search input on mount
	$effect(() => {
		if (searchInput) {
			searchInput.focus()
		}
	})

	function handleItemClick(item: SearchResult) {
		if (canAddMore) {
			onAddItems([item])
		}
	}

	function toggleElementFilter(element: number) {
		if (elementFilters.includes(element)) {
			elementFilters = elementFilters.filter(e => e !== element)
		} else {
			elementFilters = [...elementFilters, element]
		}
	}

	function toggleRarityFilter(rarity: number) {
		if (rarityFilters.includes(rarity)) {
			rarityFilters = rarityFilters.filter(r => r !== rarity)
		} else {
			rarityFilters = [...rarityFilters, rarity]
		}
	}

	function toggleProficiencyFilter(prof: number) {
		if (proficiencyFilters.includes(prof)) {
			proficiencyFilters = proficiencyFilters.filter(p => p !== prof)
		} else {
			proficiencyFilters = [...proficiencyFilters, prof]
		}
	}

	function getImageUrl(item: SearchResult): string {
		const id = item.granblueId
		if (!id) return `/images/placeholders/placeholder-${type}-square.png`

		switch (type) {
			case 'character':
				return getCharacterImage(id, 'square', '01')
			case 'weapon':
				return getWeaponImage(id, 'square')
			case 'summon':
				return getSummonImage(id, 'square')
			default:
				return ''
		}
	}

	function getItemName(item: SearchResult): string {
		const name = item.name
		if (typeof name === 'string') return name
		return name?.en || name?.ja || 'Unknown'
	}
</script>

<div class="search-content">
	<div class="search-section">
		<input
			bind:this={searchInput}
			bind:value={searchQuery}
			type="text"
			placeholder="Search by name..."
			aria-label="Search"
			class="search-input"
		/>
	</div>

	<div class="filters-section">
		<!-- Element filters -->
		<div class="filter-group">
			<label class="filter-label">Element</label>
			<div class="filter-buttons">
				{#each elements as element}
					<button
						class="filter-btn element-btn"
						class:active={elementFilters.includes(element.value)}
						style:--element-color={element.color}
						onclick={() => toggleElementFilter(element.value)}
						aria-pressed={elementFilters.includes(element.value)}
					>
						{element.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Rarity filters -->
		<div class="filter-group">
			<label class="filter-label">Rarity</label>
			<div class="filter-buttons">
				{#each rarities as rarity}
					<button
						class="filter-btn rarity-btn"
						class:active={rarityFilters.includes(rarity.value)}
						onclick={() => toggleRarityFilter(rarity.value)}
						aria-pressed={rarityFilters.includes(rarity.value)}
					>
						{rarity.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Proficiency filters (weapons only) -->
		{#if type === 'weapon'}
			<div class="filter-group">
				<label class="filter-label">Proficiency</label>
				<div class="filter-buttons proficiency-grid">
					{#each proficiencies as prof}
						<button
							class="filter-btn prof-btn"
							class:active={proficiencyFilters.includes(prof.value)}
							onclick={() => toggleProficiencyFilter(prof.value)}
							aria-pressed={proficiencyFilters.includes(prof.value)}
						>
							{prof.label}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Results -->
	<div class="results-section">
		{#if searchQueryResult.isLoading}
			<div class="loading">
				<Icon name="loader-2" size={24} />
				<span>Searching...</span>
			</div>
		{:else if searchQueryResult.isError}
			<div class="error-state">
				<Icon name="alert-circle" size={24} />
				<p>{searchQueryResult.error?.message || 'Search failed'}</p>
				<Button size="small" onclick={() => searchQueryResult.refetch()}>Retry</Button>
			</div>
		{:else if searchResults.length > 0}
			<ul class="results-list">
				{#each searchResults as item (item.id)}
					<li class="result-item">
						<button
							class="result-button"
							class:disabled={!canAddMore}
							onclick={() => handleItemClick(item)}
							aria-label="{canAddMore ? 'Add' : 'Grid full - cannot add'} {getItemName(item)}"
							disabled={!canAddMore}
						>
							<img
								src={getImageUrl(item)}
								alt={getItemName(item)}
								class="result-image"
								loading="lazy"
							/>
							<span class="result-name">{getItemName(item)}</span>
							{#if item.element !== undefined}
								<span
									class="result-element"
									style:color={elements.find(e => e.value === item.element)?.color}
								>
									{elements.find(e => e.value === item.element)?.label}
								</span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>

			{#if showSentinel}
				<div class="load-more-sentinel" bind:this={sentinelEl}></div>
			{/if}

			{#if searchQueryResult.isFetchingNextPage}
				<div class="loading-more">
					<Icon name="loader-2" size={20} />
					<span>Loading more...</span>
				</div>
			{/if}
		{:else if isEmpty}
			<div class="no-results">
				{#if searchQuery.length > 0}
					No results found
				{:else}
					Start typing to search
				{/if}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.search-content {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 60px); // Account for sidebar header
		overflow: hidden;
	}

	.search-section {
		padding: 0 0 $unit-2x 0;
		flex-shrink: 0;

		.search-input {
			width: 100%;
			padding: $unit calc($unit * 1.5);
			border: 1px solid var(--border-primary);
			border-radius: $input-corner;
			font-size: $font-regular;
			background: var(--bg-secondary);
			color: var(--text-primary);

			&:focus {
				outline: none;
				border-color: var(--accent-blue);
				box-shadow: 0 0 0 2px var(--accent-blue-alpha);
			}

			&::placeholder {
				color: var(--text-tertiary);
			}
		}
	}

	.filters-section {
		padding-bottom: $unit-2x;
		border-bottom: 1px solid var(--border-primary);
		flex-shrink: 0;

		.filter-group {
			margin-bottom: calc($unit * 1.5);

			&:last-child {
				margin-bottom: 0;
			}
		}

		.filter-label {
			display: block;
			font-size: $font-tiny;
			font-weight: $bold;
			text-transform: uppercase;
			color: var(--text-secondary);
			margin-bottom: $unit;
			letter-spacing: 0.5px;
		}

		.filter-buttons {
			display: flex;
			flex-wrap: wrap;
			gap: $unit-half;
		}

		.proficiency-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: $unit-half;
		}

		.filter-btn {
			padding: $unit-half $unit;
			border: 1px solid var(--border-primary);
			background: var(--bg-secondary);
			border-radius: $input-corner;
			font-size: $font-small;
			cursor: pointer;
			transition: all 0.2s;
			color: var(--text-primary);

			&:hover {
				background: var(--bg-tertiary);
				border-color: var(--border-secondary);
			}

			&.active {
				background: var(--accent-blue);
				color: white;
				border-color: var(--accent-blue);
			}

			&.element-btn.active {
				background: var(--element-color);
				border-color: var(--element-color);
				color: white;
			}
		}
	}

	.results-section {
		flex: 1;
		overflow-y: auto;
		padding: $unit-2x 0;
		min-height: 0;

		.loading,
		.no-results {
			text-align: center;
			padding: $unit-3x;
			color: var(--text-secondary);
			font-size: $font-regular;
		}

		.results-list {
			list-style: none;
			padding: 0;
			margin: 0;
		}

		.result-item {
			margin-bottom: $unit-half;

			.result-button {
				width: 100%;
				display: flex;
				align-items: center;
				gap: $unit;
				padding: $unit;
				border: 1px solid transparent;
				border-radius: $input-corner;
				background: var(--bg-secondary);
				cursor: pointer;
				transition: all 0.2s;
				text-align: left;

				&:hover {
					background: var(--bg-tertiary);
					border-color: var(--accent-blue);
				}

				&:active:not(:disabled) {
					transform: scale(0.99);
				}

				&.disabled,
				&:disabled {
					opacity: 0.5;
					cursor: not-allowed;
					background: var(--bg-disabled);

					&:hover {
						background: var(--bg-disabled);
						border-color: transparent;
					}
				}
			}

			.result-image {
				width: 48px;
				height: 48px;
				object-fit: cover;
				border-radius: 4px;
				border: 1px solid var(--border-primary);
				flex-shrink: 0;
			}

			.result-name {
				flex: 1;
				font-size: $font-regular;
				color: var(--text-primary);
			}

			.result-element {
				font-size: $font-small;
				font-weight: $bold;
				flex-shrink: 0;
			}
		}

		.loading {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: $unit;

			:global(svg) {
				animation: spin 1s linear infinite;
			}
		}

		.error-state {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: $unit;
			padding: $unit-3x;
			color: var(--text-secondary);

			:global(svg) {
				color: var(--text-tertiary);
			}

			p {
				margin: 0;
				font-size: $font-regular;
			}
		}

		.load-more-sentinel {
			height: 1px;
			margin-top: $unit;
		}

		.loading-more {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: $unit;
			padding: $unit-2x;
			color: var(--text-secondary);
			font-size: $font-regular;

			:global(svg) {
				animation: spin 1s linear infinite;
			}
		}
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
