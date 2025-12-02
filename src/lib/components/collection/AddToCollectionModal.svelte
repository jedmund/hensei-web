<script lang="ts">
	import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
	import { searchAdapter, type SearchResult } from '$lib/api/adapters/search.adapter'
	import { collectionQueries } from '$lib/api/queries/collection.queries'
	import { useAddCharactersToCollection } from '$lib/api/mutations/collection.mutations'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import CollectionFilters, {
		type CollectionFilterState
	} from './CollectionFilters.svelte'
	import SelectableCharacterCard from './SelectableCharacterCard.svelte'
	import { IsInViewport } from 'runed'

	interface Props {
		open?: boolean
		onOpenChange?: (open: boolean) => void
	}

	let { open = $bindable(false), onOpenChange }: Props = $props()

	// Search state
	let searchQuery = $state('')
	let debouncedQuery = $state('')
	let debounceTimer: ReturnType<typeof setTimeout>

	// Filter state
	let elementFilters = $state<number[]>([])
	let rarityFilters = $state<number[]>([])
	let seasonFilters = $state<number[]>([])
	let seriesFilters = $state<number[]>([])
	let raceFilters = $state<number[]>([])
	let proficiencyFilters = $state<number[]>([])
	let genderFilters = $state<number[]>([])

	// Selection state
	let selectedIds = $state<Set<string>>(new Set())
	let showOnlySelected = $state(false)

	// Refs
	let sentinelEl = $state<HTMLElement>()

	// Get IDs of characters already in collection
	const collectedIdsQuery = createQuery(() => collectionQueries.collectedCharacterIds())

	// Build filters for search
	const searchFilters = $derived({
		element: elementFilters.length > 0 ? elementFilters : undefined,
		rarity: rarityFilters.length > 0 ? rarityFilters : undefined,
		season: seasonFilters.length > 0 ? seasonFilters : undefined,
		characterSeries: seriesFilters.length > 0 ? seriesFilters : undefined,
		// Note: Race, proficiency, and gender filters would need API support
		// For now we filter client-side or skip if API doesn't support
		proficiency1: proficiencyFilters.length > 0 ? proficiencyFilters : undefined
	})

	// Search query with infinite scroll
	const searchResults = createInfiniteQuery(() => ({
		queryKey: ['search', 'characters', 'collection', debouncedQuery, searchFilters] as const,
		queryFn: async ({ pageParam }) => {
			const response = await searchAdapter.searchCharacters({
				query: debouncedQuery || undefined,
				page: pageParam,
				per: 60,
				filters: searchFilters,
				exclude: collectedIdsQuery.data ?? []
			})
			return {
				results: response.results ?? [],
				page: response.meta?.page ?? pageParam,
				totalPages: response.meta?.totalPages ?? 1,
				total: response.meta?.count ?? 0
			}
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			if (lastPage.page < lastPage.totalPages) {
				return lastPage.page + 1
			}
			return undefined
		},
		enabled: open && !collectedIdsQuery.isLoading
	}))

	// Flatten results and deduplicate by ID
	// (API may return duplicates across pages)
	const allResults = $derived.by(() => {
		const pages = searchResults.data?.pages ?? []
		const seen = new Set<string>()
		const results: SearchResult[] = []

		for (const page of pages) {
			for (const result of page.results) {
				if (!seen.has(result.id)) {
					seen.add(result.id)
					results.push(result)
				}
			}
		}

		return results
	})

	// Filter to show only selected if enabled
	const displayedResults = $derived(
		showOnlySelected
			? allResults.filter((r) => selectedIds.has(r.id))
			: allResults
	)

	// Add mutation
	const addMutation = useAddCharactersToCollection()

	// Debounce search input
	$effect(() => {
		clearTimeout(debounceTimer)
		debounceTimer = setTimeout(() => {
			debouncedQuery = searchQuery
		}, 300)

		return () => clearTimeout(debounceTimer)
	})

	// Infinite scroll
	const inViewport = new IsInViewport(() => sentinelEl, {
		rootMargin: '200px'
	})

	$effect(() => {
		if (
			inViewport.current &&
			searchResults.hasNextPage &&
			!searchResults.isFetchingNextPage &&
			!searchResults.isLoading &&
			!showOnlySelected
		) {
			searchResults.fetchNextPage()
		}
	})

	// Reset state when modal closes
	$effect(() => {
		if (!open) {
			selectedIds = new Set()
			showOnlySelected = false
			searchQuery = ''
			debouncedQuery = ''
			elementFilters = []
			rarityFilters = []
			seasonFilters = []
			seriesFilters = []
			raceFilters = []
			proficiencyFilters = []
			genderFilters = []
		}
	})

	function toggleSelection(character: SearchResult) {
		const newSet = new Set(selectedIds)
		if (newSet.has(character.id)) {
			newSet.delete(character.id)
		} else {
			newSet.add(character.id)
		}
		selectedIds = newSet
	}

	function handleFiltersChange(filters: CollectionFilterState) {
		elementFilters = filters.element
		rarityFilters = filters.rarity
		seasonFilters = filters.season
		seriesFilters = filters.series
		raceFilters = filters.race
		proficiencyFilters = filters.proficiency
		genderFilters = filters.gender
	}

	function toggleShowSelected() {
		showOnlySelected = !showOnlySelected
	}

	async function handleAdd() {
		if (selectedIds.size === 0) return

		const inputs = Array.from(selectedIds).map((characterId) => ({
			characterId,
			uncapLevel: 0,
			transcendenceStep: 0
		}))

		try {
			await addMutation.mutateAsync(inputs)
			open = false
			onOpenChange?.(false)
		} catch (error) {
			console.error('Failed to add characters:', error)
		}
	}

	const selectedCount = $derived(selectedIds.size)
	const isLoading = $derived(searchResults.isLoading || collectedIdsQuery.isLoading)
</script>

<Dialog bind:open {onOpenChange} title="Add Characters to Collection" size="large">
	{#snippet children()}
		<div class="modal-content">
			<!-- Search input -->
			<div class="search-bar">
				<Icon name="search" size={18} />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search characters by name..."
					class="search-input"
				/>
			</div>

			<!-- Filters -->
			<div class="filters-bar">
				<CollectionFilters
					bind:elementFilters
					bind:rarityFilters
					bind:seasonFilters
					bind:seriesFilters
					bind:raceFilters
					bind:proficiencyFilters
					bind:genderFilters
					onFiltersChange={handleFiltersChange}
					layout="horizontal"
				/>
			</div>

			<!-- Results grid -->
			<div class="results-area">
				{#if isLoading}
					<div class="loading-state">
						<Icon name="loader-2" size={32} />
						<p>Loading characters...</p>
					</div>
				{:else if displayedResults.length === 0}
					<div class="empty-state">
						{#if showOnlySelected}
							<p>No characters selected</p>
							<Button variant="ghost" size="small" onclick={toggleShowSelected}>
								Show all characters
							</Button>
						{:else if searchQuery || Object.values(searchFilters).some((v) => v)}
							<p>No characters match your search</p>
						{:else}
							<p>Start searching to find characters</p>
						{/if}
					</div>
				{:else}
					<div class="results-grid">
						{#each displayedResults as character (character.id)}
							<SelectableCharacterCard
								{character}
								selected={selectedIds.has(character.id)}
								onToggle={toggleSelection}
							/>
						{/each}
					</div>

					{#if !showOnlySelected && searchResults.hasNextPage}
						<div class="load-more-sentinel" bind:this={sentinelEl}></div>
					{/if}

					{#if searchResults.isFetchingNextPage}
						<div class="loading-more">
							<Icon name="loader-2" size={20} />
							<span>Loading more...</span>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{/snippet}

	{#snippet footer()}
		<div class="modal-footer">
			<div class="footer-left">
				{#if selectedCount > 0}
					<button
						type="button"
						class="selected-link"
						class:active={showOnlySelected}
						onclick={toggleShowSelected}
					>
						{selectedCount} character{selectedCount === 1 ? '' : 's'} selected
					</button>
				{/if}
			</div>
			<div class="footer-right">
				<Button variant="ghost" onclick={() => (open = false)}>
					Cancel
				</Button>
				<Button
					variant="primary"
					disabled={selectedCount === 0 || addMutation.isPending}
					onclick={handleAdd}
				>
					{#if addMutation.isPending}
						<Icon name="loader-2" size={16} />
						Adding...
					{:else}
						Add to Collection
					{/if}
				</Button>
			</div>
		</div>
	{/snippet}
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.modal-content {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: $unit-2x;
	}

	.search-bar {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit-half $unit;
		background: var(--input-bg, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--border-color, #ddd);

		:global(svg) {
			color: var(--text-secondary, #666);
			flex-shrink: 0;
		}
	}

	.search-input {
		flex: 1;
		border: none;
		background: transparent;
		font-size: 14px;
		padding: $unit-half 0;
		color: var(--text-primary, #333);

		&::placeholder {
			color: var(--text-tertiary, #999);
		}

		&:focus {
			outline: none;
		}
	}

	.filters-bar {
		padding-bottom: $unit;
		border-bottom: 1px solid var(--border-color, #eee);
		overflow-x: auto;
	}

	.results-area {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}

	.results-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		gap: $unit;
		padding: $unit 0;
	}

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: var(--text-secondary, #666);
		gap: $unit;

		:global(svg) {
			animation: spin 1s linear infinite;
		}

		p {
			margin: 0;
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
		color: var(--text-secondary, #666);

		:global(svg) {
			animation: spin 1s linear infinite;
		}
	}

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	.footer-left {
		flex: 1;
	}

	.footer-right {
		display: flex;
		gap: $unit;
	}

	.selected-link {
		background: none;
		border: none;
		color: var(--accent-color, #3366ff);
		font-size: 14px;
		cursor: pointer;
		padding: $unit-half $unit;
		border-radius: 4px;

		&:hover {
			background: var(--button-bg-hover, #f0f0f0);
			text-decoration: underline;
		}

		&.active {
			background: var(--accent-color, #3366ff);
			color: white;

			&:hover {
				background: var(--accent-color-hover, #2255ee);
				text-decoration: none;
			}
		}
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
