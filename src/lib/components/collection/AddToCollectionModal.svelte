<script lang="ts">
	import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
	import { collectionQueries } from '$lib/api/queries/collection.queries'
	import {
		searchQueries,
		type SearchFilters,
		type SearchPageResult
	} from '$lib/api/queries/search.queries'
	import {
		useAddCharactersToCollection,
		useAddWeaponsToCollection,
		useAddSummonsToCollection
	} from '$lib/api/mutations/collection.mutations'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import CollectionFilters, {
		type CollectionFilterState
	} from './CollectionFilters.svelte'
	import SelectableCharacterCard from './SelectableCharacterCard.svelte'
	import SelectableCharacterRow from './SelectableCharacterRow.svelte'
	import SelectableWeaponCard from './SelectableWeaponCard.svelte'
	import SelectableWeaponRow from './SelectableWeaponRow.svelte'
	import SelectableSummonCard from './SelectableSummonCard.svelte'
	import SelectableSummonRow from './SelectableSummonRow.svelte'
	import { IsInViewport } from 'runed'
	import { viewMode, type ViewMode } from '$lib/stores/viewMode.svelte'

	type SearchResultItem = SearchPageResult['results'][number]
	type EntityType = 'character' | 'weapon' | 'summon'

	interface Props {
		userId: string
		entityType?: EntityType
		open?: boolean
		onOpenChange?: (open: boolean) => void
	}

	let { userId, entityType = 'character', open = $bindable(false), onOpenChange }: Props = $props()

	// Search state
	let searchQuery = $state('')

	// Filter state
	let elementFilters = $state<number[]>([])
	let rarityFilters = $state<number[]>([])
	let seasonFilters = $state<number[]>([])
	let seriesFilters = $state<(number | string)[]>([])
	let raceFilters = $state<number[]>([])
	let proficiencyFilters = $state<number[]>([])
	let genderFilters = $state<number[]>([])

	// Selection state - characters use Set<string>, weapons/summons use Map<string, number> for quantities
	let selectedIds = $state<Set<string>>(new Set())
	let selectedQuantities = $state<Map<string, number>>(new Map())
	let showOnlySelected = $state(false)

	// Refs
	let sentinelEl = $state<HTMLElement>()

	// Entity type display names
	const entityNames: Record<EntityType, { singular: string; plural: string }> = {
		character: { singular: 'character', plural: 'characters' },
		weapon: { singular: 'weapon', plural: 'weapons' },
		summon: { singular: 'summon', plural: 'summons' }
	}

	// Get IDs of characters already in collection (only used for characters)
	const collectedIdsQuery = createQuery(() =>
		collectionQueries.collectedCharacterIds(userId, entityType === 'character')
	)

	// Build filters for search (using SearchFilters type from search.queries)
	// Filter seriesFilters to only numbers for characterSeries (strings are weapon UUIDs)
	const numericSeriesFilters = $derived(
		seriesFilters.filter((s): s is number => typeof s === 'number')
	)
	const searchFilters = $derived<SearchFilters>({
		element: elementFilters.length > 0 ? elementFilters : undefined,
		rarity: rarityFilters.length > 0 ? rarityFilters : undefined,
		season: seasonFilters.length > 0 ? seasonFilters : undefined,
		characterSeries: numericSeriesFilters.length > 0 ? numericSeriesFilters : undefined,
		proficiency: proficiencyFilters.length > 0 ? proficiencyFilters : undefined
	})

	// Search query with infinite scroll - dynamic based on entity type
	// Type assertion needed because queryKeys differ but data shape is the same
	const getSearchOptions = () => {
		const query = searchQuery
		const filters = searchFilters

		if (entityType === 'character') {
			const excludeIds = collectedIdsQuery.data ?? []
			const isEnabled = open && !collectedIdsQuery.isLoading
			return searchQueries.characters(query, filters, 'en', excludeIds, isEnabled)
		} else if (entityType === 'weapon') {
			return {
				...searchQueries.weapons(query, filters, 'en'),
				enabled: open
			}
		} else {
			return {
				...searchQueries.summons(query, filters, 'en'),
				enabled: open
			}
		}
	}
	const searchResults = createInfiniteQuery(getSearchOptions as () => ReturnType<typeof searchQueries.weapons>)

	// Flatten results and deduplicate by ID
	const allResults = $derived.by(() => {
		const pages = searchResults.data?.pages ?? []
		const seen = new Set<string>()
		const results: typeof pages[number]['results'] = []

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
	const displayedResults = $derived.by(() => {
		if (!showOnlySelected) return allResults

		if (entityType === 'character') {
			return allResults.filter((r) => selectedIds.has(r.id))
		} else {
			return allResults.filter((r) => (selectedQuantities.get(r.id) ?? 0) > 0)
		}
	})

	// Add mutations
	const addCharacterMutation = useAddCharactersToCollection()
	const addWeaponMutation = useAddWeaponsToCollection()
	const addSummonMutation = useAddSummonsToCollection()

	// Current mutation based on entity type
	const currentMutation = $derived(
		entityType === 'character'
			? addCharacterMutation
			: entityType === 'weapon'
				? addWeaponMutation
				: addSummonMutation
	)

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

	// Reset state when modal closes or entity type changes
	$effect(() => {
		if (!open) {
			resetState()
		}
	})

	function resetState() {
		selectedIds = new Set()
		selectedQuantities = new Map()
		showOnlySelected = false
		searchQuery = ''
		elementFilters = []
		rarityFilters = []
		seasonFilters = []
		seriesFilters = []
		raceFilters = []
		proficiencyFilters = []
		genderFilters = []
	}

	// Character toggle (binary selection)
	function toggleCharacterSelection(character: SearchResultItem) {
		const newSet = new Set(selectedIds)
		if (newSet.has(character.id)) {
			newSet.delete(character.id)
		} else {
			newSet.add(character.id)
		}
		selectedIds = newSet
	}

	// Weapon/Summon quantity change
	function handleQuantityChange(item: SearchResultItem, quantity: number) {
		const newMap = new Map(selectedQuantities)
		if (quantity <= 0) {
			newMap.delete(item.id)
		} else {
			newMap.set(item.id, quantity)
		}
		selectedQuantities = newMap
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
		// Capture selected data before any state changes
		const currentEntityType = entityType
		const characterInputs =
			currentEntityType === 'character'
				? Array.from(selectedIds).map((characterId) => ({
						characterId,
						uncapLevel: 4,
						transcendenceStep: 0
					}))
				: []
		const weaponInputs =
			currentEntityType === 'weapon'
				? Array.from(selectedQuantities.entries()).map(([weaponId, quantity]) => ({
						weaponId,
						quantity,
						uncapLevel: 3,
						transcendenceStep: 0
					}))
				: []
		const summonInputs =
			currentEntityType === 'summon'
				? Array.from(selectedQuantities.entries()).map(([summonId, quantity]) => ({
						summonId,
						quantity,
						uncapLevel: 3,
						transcendenceStep: 0
					}))
				: []

		try {
			if (currentEntityType === 'character') {
				if (characterInputs.length === 0) return
				await addCharacterMutation.mutateAsync(characterInputs)
			} else if (currentEntityType === 'weapon') {
				if (weaponInputs.length === 0) return
				await addWeaponMutation.mutateAsync(weaponInputs)
			} else {
				if (summonInputs.length === 0) return
				await addSummonMutation.mutateAsync(summonInputs)
			}

			// Close modal after successful mutation
			open = false
			onOpenChange?.(false)
		} catch (error) {
			// Log all errors except cancellation
			const isCancelledError =
				error && typeof error === 'object' && 'name' in error && error.name === 'CancelledError'
			if (!isCancelledError) {
				console.error(`Failed to add ${entityNames[currentEntityType].plural}:`, error)
			}
		}
	}

	// Selected count
	const selectedCount = $derived(
		entityType === 'character'
			? selectedIds.size
			: Array.from(selectedQuantities.values()).reduce((sum, qty) => sum + qty, 0)
	)

	// Total items selected (for weapons/summons, this is unique items, not total quantity)
	const selectedItemCount = $derived(
		entityType === 'character' ? selectedIds.size : selectedQuantities.size
	)

	const isLoading = $derived(
		searchResults.isLoading || (entityType === 'character' && collectedIdsQuery.isLoading)
	)

	// View mode from store
	const currentViewMode = $derived(viewMode.modalView)

	function handleViewModeChange(mode: ViewMode) {
		viewMode.setModalView(mode)
	}

	// Dialog title based on entity type
	const dialogTitle = $derived(`Add ${entityNames[entityType].plural.charAt(0).toUpperCase() + entityNames[entityType].plural.slice(1)} to Collection`)

	// Placeholder text based on entity type
	const searchPlaceholder = $derived(`Search ${entityNames[entityType].plural} by name...`)

	// Footer text based on entity type
	const selectedText = $derived.by(() => {
		if (entityType === 'character') {
			return `${selectedCount} ${selectedCount === 1 ? entityNames[entityType].singular : entityNames[entityType].plural} selected`
		} else {
			// For weapons/summons, show both item count and total quantity
			if (selectedItemCount === 0) return ''
			const itemText = `${selectedItemCount} ${selectedItemCount === 1 ? 'item' : 'items'}`
			const qtyText = selectedCount > selectedItemCount ? ` (${selectedCount} total)` : ''
			return `${itemText}${qtyText} selected`
		}
	})
</script>

<Dialog bind:open {onOpenChange} size="large">
	{#snippet children()}
		<ModalHeader title={dialogTitle} />
		<div class="modal-content">
			<!-- Search input -->
			<div class="search-bar">
				<Icon name="search" size={18} />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder={searchPlaceholder}
					class="search-input"
				/>
			</div>

			<!-- Filters -->
			<div class="filters-bar">
				<CollectionFilters
					{entityType}
					bind:elementFilters
					bind:rarityFilters
					bind:seasonFilters
					bind:seriesFilters
					bind:raceFilters
					bind:proficiencyFilters
					bind:genderFilters
					onFiltersChange={handleFiltersChange}
					showSort={false}
					showViewToggle={true}
					viewMode={currentViewMode}
					onViewModeChange={handleViewModeChange}
				/>
			</div>

			<!-- Results -->
			<div class="results-area">
				{#if isLoading}
					<div class="loading-state">
						<Icon name="loader-2" size={32} />
						<p>Loading {entityNames[entityType].plural}...</p>
					</div>
				{:else if displayedResults.length === 0}
					<div class="empty-state">
						{#if showOnlySelected}
							<p>No {entityNames[entityType].plural} selected</p>
							<Button variant="ghost" size="small" onclick={toggleShowSelected}>
								Show all {entityNames[entityType].plural}
							</Button>
						{:else if searchQuery || Object.values(searchFilters).some((v) => v)}
							<p>No {entityNames[entityType].plural} match your search</p>
						{:else}
							<p>Start searching to find {entityNames[entityType].plural}</p>
						{/if}
					</div>
				{:else if currentViewMode === 'grid'}
					<div class="results-grid">
						{#if entityType === 'character'}
							{#each displayedResults as character (character.id)}
								<SelectableCharacterCard
									{character}
									selected={selectedIds.has(character.id)}
									onToggle={toggleCharacterSelection}
								/>
							{/each}
						{:else if entityType === 'weapon'}
							{#each displayedResults as weapon (weapon.id)}
								<SelectableWeaponCard
									{weapon}
									quantity={selectedQuantities.get(weapon.id) ?? 0}
									onQuantityChange={handleQuantityChange}
								/>
							{/each}
						{:else}
							{#each displayedResults as summon (summon.id)}
								<SelectableSummonCard
									{summon}
									quantity={selectedQuantities.get(summon.id) ?? 0}
									onQuantityChange={handleQuantityChange}
								/>
							{/each}
						{/if}
					</div>
				{:else}
					<div class="results-list">
						{#if entityType === 'character'}
							{#each displayedResults as character (character.id)}
								<SelectableCharacterRow
									{character}
									selected={selectedIds.has(character.id)}
									onToggle={toggleCharacterSelection}
								/>
							{/each}
						{:else if entityType === 'weapon'}
							{#each displayedResults as weapon (weapon.id)}
								<SelectableWeaponRow
									{weapon}
									quantity={selectedQuantities.get(weapon.id) ?? 0}
									onQuantityChange={handleQuantityChange}
								/>
							{/each}
						{:else}
							{#each displayedResults as summon (summon.id)}
								<SelectableSummonRow
									{summon}
									quantity={selectedQuantities.get(summon.id) ?? 0}
									onQuantityChange={handleQuantityChange}
								/>
							{/each}
						{/if}
					</div>
				{/if}

				{#if displayedResults.length > 0}
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
		<ModalFooter
			onCancel={() => (open = false)}
			primaryAction={{
				label: currentMutation.isPending ? 'Adding...' : 'Add to Collection',
				onclick: handleAdd,
				disabled: selectedCount === 0 || currentMutation.isPending
			}}
		>
			{#snippet left()}
				{#if selectedCount > 0}
					<button
						type="button"
						class="selected-link"
						class:active={showOnlySelected}
						onclick={toggleShowSelected}
					>
						{selectedText}
					</button>
				{/if}
			{/snippet}
		</ModalFooter>
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
		display: flex;
		flex-wrap: wrap;
		gap: $unit;
		padding: $unit 0;
	}

	.results-list {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
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
