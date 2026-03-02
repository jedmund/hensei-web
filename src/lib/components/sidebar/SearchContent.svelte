<svelte:options runes={true} />

<script lang="ts">
	import { createInfiniteQuery, createQuery } from '@tanstack/svelte-query'
	import { onDestroy } from 'svelte'
	import type { SearchResult } from '$lib/api/adapters/search.adapter'
	import { searchQueries, type SearchFilters } from '$lib/api/queries/search.queries'
	import { collectionQueries } from '$lib/api/queries/collection.queries'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import Button from '../ui/Button.svelte'
	import Select from '../ui/Select.svelte'
	import Icon from '../Icon.svelte'
	import Input from '../ui/Input.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import ElementPicker from '../ui/element-picker/ElementPicker.svelte'
	import RarityPicker from '../ui/rarity-picker/RarityPicker.svelte'
	import ProficiencyPicker from '../ui/proficiency-picker/ProficiencyPicker.svelte'
	import SegmentedControl from '../ui/segmented-control/SegmentedControl.svelte'
	import Segment from '../ui/segmented-control/Segment.svelte'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
	import { getCharacterImage, getWeaponImage, getSummonImage, getPlaceholder } from '$lib/features/database/detail/image'
	import type { AddItemResult, SearchMode } from '$lib/types/api/search'
	import type { CollectionCharacter, CollectionWeapon, CollectionSummon } from '$lib/types/api/collection'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { partyStore } from '$lib/stores/partyStore.svelte'
	import { getAvatarSrc } from '$lib/utils/avatar'

	interface Props {
		type: 'weapon' | 'character' | 'summon'
		onAddItems?: (items: AddItemResult[]) => void
		canAddMore?: boolean
		/** User ID to enable collection search mode */
		authUserId?: string
		/** Required proficiencies for mainhand weapon selection */
		requiredProficiencies?: number[]
		/** User's element for styling the collection toggle */
		userElement?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
		/** If set, collection mode is locked to this user's collection */
		collectionSourceUserId?: string
		/** Callback to unlink all collection items from the party */
		onUnlinkCollection?: () => Promise<void>
	}

	let {
		type = 'weapon',
		onAddItems = () => {},
		canAddMore = true,
		authUserId,
		requiredProficiencies,
		userElement,
		collectionSourceUserId,
		onUnlinkCollection
	}: Props = $props()

	// Search state (local UI state)
	let searchQuery = $state('')
	let debouncedSearchQuery = $state('')
	let debounceTimer: ReturnType<typeof setTimeout> | undefined

	// Filter state
	let elementFilters = $state<number[]>([])
	let rarityFilters = $state<number[]>([])
	let proficiencyFilters = $state<number[]>([])
	let seriesFilter = $state<string | undefined>(undefined)

	// Search mode state (only available when authUserId is provided)
	let searchMode = $state<SearchMode>('all')

	// Crew member selection state
	let selectedMemberId = $state<string | undefined>(collectionSourceUserId ?? authUserId)

	// Refs
	let sentinelEl = $state<HTMLElement>()

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

	// Series query - fetch list based on current type
	const seriesQuery = createQuery(() => {
		switch (type) {
			case 'weapon':
				return entityQueries.weaponSeriesList()
			case 'character':
				return entityQueries.characterSeriesList()
			case 'summon':
				return entityQueries.summonSeriesList()
		}
	})

	// Build series options for dropdown (use ID for API filtering)
	const seriesOptions = $derived.by(() => {
		const data = seriesQuery.data
		if (!data) return []
		return data.map((s) => ({
			value: s.id,
			label: s.name.en
		}))
	})

	// Crew members with accessible collections (for collection mode dropdown)
	const crewMembersQuery = createQuery(() => ({
		...crewQueries.accessibleCollectionMembers(),
		enabled: crewStore.isInCrew
	}))

	const memberOptions = $derived.by(() => {
		const members = crewMembersQuery.data ?? []
		const options: { value: string; label: string; image?: string; suffix?: string }[] = []

		if (authUserId) {
			const selfMember = members.find((m) => m.userId === authUserId)
			options.push({
				value: authUserId,
				label: selfMember?.username ?? 'You',
				image: selfMember ? getAvatarSrc(selfMember.avatarPicture) : undefined,
				suffix: 'You'
			})
		}

		for (const m of members) {
			if (m.userId !== authUserId) {
				options.push({
					value: m.userId,
					label: m.username,
					image: getAvatarSrc(m.avatarPicture)
				})
			}
		}

		return options
	})

	// Reactive collection source from partyStore (updates when party data refreshes after mutations)
	const reactiveSourceUserId = $derived(partyStore.party?.collectionSourceUserId)

	// The userId whose collection we're currently browsing
	const collectionUserId = $derived.by(() => {
		if (reactiveSourceUserId) return reactiveSourceUserId
		if (searchMode !== 'collection') return authUserId
		return selectedMemberId
	})

	const isCollectionLocked = $derived(!!reactiveSourceUserId)

	const showMemberDropdown = $derived(
		(searchMode === 'collection' && crewStore.isInCrew && memberOptions.length > 1) || isCollectionLocked
	)

	// Get selected member's username for empty state messaging
	const selectedMemberName = $derived.by(() => {
		if (!selectedMemberId || selectedMemberId === authUserId) return undefined
		const members = crewMembersQuery.data ?? []
		return members.find((m) => m.userId === selectedMemberId)?.username
	})

	// Build filters object for query
	// Use requiredProficiencies for mainhand selection if set, otherwise use user-selected filters
	const effectiveProficiencies = $derived(
		requiredProficiencies ?? (proficiencyFilters.length > 0 ? proficiencyFilters : undefined)
	)

	const filters = $derived<SearchFilters>({
		element: elementFilters.length > 0 ? elementFilters : undefined,
		rarity: rarityFilters.length > 0 ? rarityFilters : undefined,
		proficiency: type === 'weapon' && effectiveProficiencies ? effectiveProficiencies : undefined,
		series: seriesFilter ? [seriesFilter] : undefined
	})

	// Helper to map collection items to search result format with collectionId
	function mapCollectionToSearchResult(
		item: CollectionCharacter | CollectionWeapon | CollectionSummon
	): AddItemResult {
		const entity = 'character' in item ? item.character : 'weapon' in item ? item.weapon : item.summon
		return {
			id: entity.id,
			granblueId: entity.granblueId,
			name: entity.name,
			element: entity.element,
			rarity: entity.rarity,
			collectionId: item.id,
			collectionSourceUserId: collectionUserId
		}
	}

	// Filter collection items by search query (client-side)
	function filterCollectionByQuery<T extends CollectionCharacter | CollectionWeapon | CollectionSummon>(
		items: T[],
		query: string
	): T[] {
		if (!query.trim()) return items
		const lowerQuery = query.toLowerCase()
		return items.filter((item) => {
			const entity = 'character' in item ? item.character : 'weapon' in item ? item.weapon : item.summon
			const name = entity.name
			const nameEn = typeof name === 'string' ? name : name?.en || ''
			const nameJa = typeof name === 'string' ? '' : name?.ja || ''
			return nameEn.toLowerCase().includes(lowerQuery) || nameJa.toLowerCase().includes(lowerQuery)
		})
	}

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

	// Collection query - enabled when authUserId is provided
	// Used both for collection mode AND for highlighting owned items in "all" mode
	// Type assertion needed because different types have different query result types
	// but they all share the same structure with different content types
	const collectionQueryResult = createInfiniteQuery(() => {
		const userId = collectionUserId
		if (!userId) {
			// Return a disabled query config
			return {
				...collectionQueries.characters(userId ?? '', {}, false),
				enabled: false
			} as ReturnType<typeof collectionQueries.characters>
		}

		// For collection mode, apply filters; for "all" mode, fetch all to build owned set
		const currentFilters = searchMode === 'collection' ? {
			element: elementFilters.length > 0 ? elementFilters : undefined,
			rarity: rarityFilters.length > 0 ? rarityFilters : undefined
		} : {}

		switch (type) {
			case 'weapon':
				return {
					...collectionQueries.weapons(userId, currentFilters),
					enabled: true
				} as unknown as ReturnType<typeof collectionQueries.characters>
			case 'character':
				return {
					...collectionQueries.characters(userId, currentFilters),
					enabled: true
				}
			case 'summon':
				return {
					...collectionQueries.summons(userId, currentFilters),
					enabled: true
				} as unknown as ReturnType<typeof collectionQueries.characters>
		}
	})

	// Flatten all pages into a single items array
	const rawResults = $derived(
		searchQueryResult.data?.pages.flatMap((page) => page.results) ?? []
	)

	// Collection results (filtered client-side by search query)
	const rawCollectionResults = $derived.by(() => {
		const pages = collectionQueryResult.data?.pages ?? []
		const allItems = pages.flatMap((page) => page.results)
		return filterCollectionByQuery(allItems, debouncedSearchQuery)
	})

	// Set of owned item granblue IDs for fast lookup (used in "all" mode to highlight owned items)
	const ownedItemIds = $derived.by(() => {
		const pages = collectionQueryResult.data?.pages ?? []
		const allItems = pages.flatMap((page) => page.results)
		const ids = new Set<string>()
		for (const item of allItems) {
			// Type assertion needed because the query result type doesn't capture all variants
			const anyItem = item as unknown as Record<string, unknown>
			const entity = (anyItem.character ?? anyItem.weapon ?? anyItem.summon) as
				| { granblueId?: string }
				| undefined
			if (entity?.granblueId) {
				ids.add(String(entity.granblueId))
			}
		}
		return ids
	})

	// Helper to check if an item is owned (in user's collection)
	function isOwned(item: AddItemResult): boolean {
		return ownedItemIds.has(String(item.granblueId))
	}

	// Deduplicate by id - needed because the API may return the same item across pages
	// (e.g., due to items being added/removed between page fetches)
	const searchResults = $derived.by<AddItemResult[]>(() => {
		if (searchMode === 'collection' && authUserId) {
			// Map collection items to AddItemResult format
			return rawCollectionResults.map(mapCollectionToSearchResult)
		}
		// Regular search results - cast to AddItemResult[] since they're compatible
		const deduped = Array.from(new Map(rawResults.map((item) => [item.id, item])).values())
		return deduped as AddItemResult[]
	})

	// Get the active query based on search mode
	const activeQuery = $derived(
		searchMode === 'collection' && authUserId ? collectionQueryResult : searchQueryResult
	)

	// State-gated infinite scroll
	// Type assertion needed because activeQuery is a union of different query types
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const loader = useInfiniteLoader(() => activeQuery as any, () => sentinelEl, { rootMargin: '200px' })

	// Reset loader when search mode or filters change
	$effect(() => {
		void searchMode
		void filters
		loader.reset()
	})

	// Cleanup on destroy
	onDestroy(() => loader.destroy())

	// Computed states
	const isEmpty = $derived(
		searchResults.length === 0 && !activeQuery.isLoading && !activeQuery.isError
	)

	function handleItemClick(item: AddItemResult) {
		if (canAddMore) {
			onAddItems([item])
		}
	}

	function handleElementChange(value: number | number[]) {
		elementFilters = Array.isArray(value) ? value : value !== undefined ? [value] : []
	}

	function handleRarityChange(value: number | number[]) {
		rarityFilters = Array.isArray(value) ? value : value !== undefined ? [value] : []
	}

	function handleSeriesChange(value: string | undefined) {
		seriesFilter = value
	}

	function handleProficiencyChange(value: number | number[]) {
		proficiencyFilters = Array.isArray(value) ? value : value !== undefined ? [value] : []
	}

	function getImageUrl(item: AddItemResult): string {
		const id = item.granblueId
		if (!id) return getPlaceholder(type, 'square')

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

	function getItemName(item: AddItemResult): string {
		const name = item.name
		if (typeof name === 'string') return name
		return name?.en || name?.ja || 'Unknown'
	}
</script>

<div class="search-content">
	<div class="search-section">
		<Input
			bind:value={searchQuery}
			type="text"
			placeholder="Search by name..."
			leftIcon="search"
			contained
			fullWidth
			class="search-input"
		/>
	</div>

	{#if authUserId}
		<div class="mode-toggle">
			<SegmentedControl
				value={searchMode}
				onValueChange={(v) => searchMode = v as SearchMode}
				variant="background"
				size="small"
				element={userElement}
				grow
			>
				<Segment value="all">All Items</Segment>
				<Segment value="collection">Collection</Segment>
			</SegmentedControl>
		</div>
	{/if}

	{#if showMemberDropdown}
		<div class="member-select">
			<Select
				options={memberOptions}
				value={isCollectionLocked ? reactiveSourceUserId : selectedMemberId}
				onValueChange={(v) => { selectedMemberId = v }}
				placeholder="Select member"
				disabled={isCollectionLocked}
				contained
				fullWidth
			/>
			{#if isCollectionLocked}
				<button
					class="unlink-button"
					onclick={async () => {
					if (onUnlinkCollection) await onUnlinkCollection()
					selectedMemberId = authUserId
				}}
				>
					Clear collection source
				</button>
			{/if}
		</div>
	{/if}

	<div class="filters-section">
		<!-- Rarity and Element filters (side by side) -->
		<div class="filter-row">
			<div class="filter-group">
				<div class="filter-header">
					<label class="filter-label">Rarity</label>
					{#if rarityFilters.length > 0}
						<a href="#" class="clear-link" onclick={(e) => { e.preventDefault(); rarityFilters = [] }}>Clear</a>
					{/if}
				</div>
				<RarityPicker
					value={rarityFilters}
					onValueChange={handleRarityChange}
					multiple={true}
					contained={true}
					size="small"
				/>
			</div>

			<div class="filter-group">
				<div class="filter-header">
					<label class="filter-label">Element</label>
					{#if elementFilters.length > 0}
						<a href="#" class="clear-link" onclick={(e) => { e.preventDefault(); elementFilters = [] }}>Clear</a>
					{/if}
				</div>
				<ElementPicker
					value={elementFilters}
					onValueChange={handleElementChange}
					multiple={true}
					includeAny={true}
					contained={true}
					size="small"
				/>
			</div>
		</div>

		<!-- Proficiency filters (weapons and characters, hidden when required proficiencies set for mainhand) -->
		{#if (type === 'weapon' || type === 'character') && !requiredProficiencies}
			<div class="filter-group">
				<div class="filter-header">
					<label class="filter-label">Proficiency</label>
					{#if proficiencyFilters.length > 0}
						<a href="#" class="clear-link" onclick={(e) => { e.preventDefault(); proficiencyFilters = [] }}>Clear</a>
					{/if}
				</div>
				<ProficiencyPicker
					value={proficiencyFilters}
					onValueChange={handleProficiencyChange}
					multiple={true}
					contained={true}
					size="small"
				/>
			</div>
		{/if}

		<!-- Series filter -->
		<div class="filter-group">
			<div class="filter-header">
				<label class="filter-label">Series</label>
				{#if seriesFilter}
					<a href="#" class="clear-link" onclick={(e) => { e.preventDefault(); seriesFilter = undefined }}>Clear</a>
				{/if}
			</div>
			<Select
				options={seriesOptions}
				value={seriesFilter}
				onValueChange={handleSeriesChange}
				placeholder="All series"
				contained={true}
				fullWidth={true}
			/>
		</div>
	</div>

	<!-- Results -->
	<div class="results-section">
		{#if activeQuery.isLoading}
			<div class="loading">
				<Icon name="loader-2" size={24} />
				<span>Searching...</span>
			</div>
		{:else if activeQuery.isError}
			<div class="error-state">
				<Icon name="alert-circle" size={24} />
				<p>{activeQuery.error?.message || 'Search failed'}</p>
				<Button size="small" onclick={() => activeQuery.refetch()}>Retry</Button>
			</div>
		{:else if searchResults.length > 0}
			<ul class="results-list">
				{#each searchResults as item (item.collectionId || item.id)}
					{@const owned = searchMode === 'all' && authUserId && isOwned(item)}
					<li class="result-item">
						<button
							class="result-button"
							class:disabled={!canAddMore}
							class:from-collection={item.collectionId}
							class:owned={owned}
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
							<div class="result-info">
								<span class="result-name">{getItemName(item)}</span>
								<div class="result-labels">
									{#if item.element !== undefined}
										<ElementLabel element={item.element} size="small" />
									{/if}
									{#if Array.isArray(item.proficiency)}
										{#each item.proficiency as prof}
											<ProficiencyLabel proficiency={prof} size="small" />
										{/each}
									{:else if item.proficiency !== undefined}
										<ProficiencyLabel proficiency={item.proficiency} size="small" />
									{/if}
								</div>
							</div>
							{#if type === 'character'}
								<CharacterTags character={item} />
							{/if}
							{#if item.collectionId}
								<Icon name="bookmark" size={14} class="collection-indicator" />
							{:else if owned}
								<Icon name="check" size={14} class="owned-indicator" />
							{/if}
						</button>
					</li>
				{/each}
			</ul>

			<div
				class="load-more-sentinel"
				bind:this={sentinelEl}
				class:hidden={!activeQuery.hasNextPage}
			></div>

			{#if activeQuery.isFetchingNextPage}
				<div class="loading-more">
					<Icon name="loader-2" size={20} />
					<span>Loading more...</span>
				</div>
			{/if}
		{:else if isEmpty}
			<div class="no-results">
				{#if searchMode === 'collection'}
					{#if searchQuery.length > 0}
						No items match your search
					{:else if selectedMemberName}
						{selectedMemberName}'s collection is empty
					{:else}
						Your collection is empty
					{/if}
				{:else if searchQuery.length > 0}
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
		padding: 0 $unit-2x $unit-2x $unit-2x;
		flex-shrink: 0;

		:global(.search-input) {
			border-radius: $card-corner;
		}
	}

	.mode-toggle {
		padding: 0 $unit-2x $unit-2x $unit-2x;
		flex-shrink: 0;
	}

	.member-select {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		padding: 0 $unit-2x $unit-2x $unit-2x;
		flex-shrink: 0;

		.unlink-button {
			background: none;
			border: none;
			padding: 0 $unit-half;
			font-size: $font-small;
			color: var(--text-secondary);
			cursor: pointer;
			text-align: left;
			transition: 0.15s color ease-out;

			&:hover {
				color: var(--text-primary);
			}
		}
	}

	.filters-section {
		display: flex;
		flex-direction: column;
		gap: calc($unit * 1.5);
		padding: 0 $unit-2x $unit-2x $unit-2x;
		border-bottom: 1px solid var(--border-primary);
		flex-shrink: 0;

		.filter-row {
			display: flex;
			justify-content: space-between;
			gap: $unit;
		}

		.filter-group {
			display: flex;
			flex-direction: column;
			gap: $unit;
		}

		.filter-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0 $unit-half;
		}

		.filter-label {
			display: block;
			font-size: $font-small;
			font-weight: $bold;
			color: var(--text-secondary);
		}

		.clear-link {
			font-size: $font-small;
			color: var(--text-secondary);
			text-decoration: none;
			cursor: pointer;
			transition: 0.15s color ease-out;

			&:hover {
				color: var(--text-primary);
			}
		}
	}

	.results-section {
		flex: 1;
		overflow-y: auto;
		padding: $unit-2x;
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
				border: none;
				border-radius: $input-corner;
				background: transparent;
				cursor: pointer;
				transition: background-color 0.15s ease-out;
				text-align: left;

				&:hover {
					background: var(--bg-tertiary);
				}

				&:active:not(:disabled) {
					transform: scale(0.99);
				}

				&.disabled,
				&:disabled {
					opacity: 0.5;
					cursor: not-allowed;

					&:hover {
						background: transparent;
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

			.result-labels {
				display: flex;
				align-items: center;
				gap: $unit-half;
			}

			:global(.collection-indicator) {
				color: var(--accent-blue);
				flex-shrink: 0;
			}

			:global(.owned-indicator) {
				color: var(--success, #4caf50);
				flex-shrink: 0;
				opacity: 0.7;
			}

			// Subtle highlight for owned items in "all" mode
			.result-button.owned {
				background: var(--owned-bg, rgba(76, 175, 80, 0.08));

				&:hover {
					background: var(--owned-bg-hover, rgba(76, 175, 80, 0.15));
				}
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

			&.hidden {
				display: none;
			}
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
