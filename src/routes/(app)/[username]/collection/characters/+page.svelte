<script lang="ts">
	import type { PageData } from './$types'
	import type { CollectionCharacter, CollectionSortKey } from '$lib/types/api/collection'
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import { collectionQueries } from '$lib/api/queries/collection.queries'
	import CollectionFilters, {
		type CollectionFilterState
	} from '$lib/components/collection/CollectionFilters.svelte'
	import CollectionCharacterPane from '$lib/components/collection/CollectionCharacterPane.svelte'
	import CollectionCharacterCard from '$lib/components/collection/CollectionCharacterCard.svelte'
	import CollectionCharacterRow from '$lib/components/collection/CollectionCharacterRow.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { IsInViewport } from 'runed'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { viewMode, type ViewMode } from '$lib/stores/viewMode.svelte'

	const { data }: { data: PageData } = $props()

	// Filter state
	let elementFilters = $state<number[]>([])
	let rarityFilters = $state<number[]>([])
	let raceFilters = $state<number[]>([])
	let proficiencyFilters = $state<number[]>([])
	let genderFilters = $state<number[]>([])

	// Sort state
	let sortBy = $state<CollectionSortKey>('name_asc')

	// Sentinel for infinite scroll
	let sentinelEl = $state<HTMLElement>()

	// Build filters for query - all filters are now server-side for everyone
	const queryFilters = $derived({
		element: elementFilters.length > 0 ? elementFilters : undefined,
		rarity: rarityFilters.length > 0 ? rarityFilters : undefined,
		race: raceFilters.length > 0 ? raceFilters : undefined,
		proficiency: proficiencyFilters.length > 0 ? proficiencyFilters : undefined,
		gender: genderFilters.length > 0 ? genderFilters : undefined,
		sort: sortBy
	})

	// Unified query for any user's collection (privacy enforced server-side)
	const collectionQuery = createInfiniteQuery(() => {
		const userId = data.user.id
		const filters = queryFilters
		return collectionQueries.characters(userId, filters)
	})

	// Flatten all characters from pages
	const allCharacters = $derived.by((): CollectionCharacter[] => {
		if (!collectionQuery.data?.pages) {
			return []
		}
		return collectionQuery.data.pages.flatMap((page) => page.results ?? [])
	})

	// Infinite scroll
	const inViewport = new IsInViewport(() => sentinelEl, {
		rootMargin: '200px'
	})

	$effect(() => {
		if (
			inViewport.current &&
			collectionQuery.hasNextPage &&
			!collectionQuery.isFetchingNextPage &&
			!collectionQuery.isLoading
		) {
			collectionQuery.fetchNextPage()
		}
	})

	const isLoading = $derived(collectionQuery.isLoading)
	const isEmpty = $derived(!isLoading && allCharacters.length === 0)
	const showSentinel = $derived(collectionQuery.hasNextPage && !collectionQuery.isFetchingNextPage)

	// Current view mode from store
	const currentViewMode = $derived(viewMode.collectionView)

	function handleFiltersChange(filters: CollectionFilterState) {
		elementFilters = filters.element
		rarityFilters = filters.rarity
		raceFilters = filters.race
		proficiencyFilters = filters.proficiency
		genderFilters = filters.gender
	}

	function handleViewModeChange(mode: ViewMode) {
		viewMode.setCollectionView(mode)
	}

	function openCharacterDetails(character: CollectionCharacter) {
		const characterName =
			typeof character.character?.name === 'string'
				? character.character.name
				: character.character?.name?.en || 'Character'

		sidebar.openWithComponent(characterName, CollectionCharacterPane, {
			character,
			isOwner: data.isOwner,
			onClose: () => sidebar.close()
		})
	}
</script>

<div class="collection-page">
	<!-- Action bar -->
	<div class="action-bar">
		<CollectionFilters
			bind:elementFilters
			bind:rarityFilters
			bind:raceFilters
			bind:proficiencyFilters
			bind:genderFilters
			bind:sortBy
			onFiltersChange={handleFiltersChange}
			showFilters={{
				element: true,
				rarity: true,
				season: false,
				series: false,
				race: true,
				proficiency: true,
				gender: true
			}}
			showViewToggle={true}
			viewMode={currentViewMode}
			onViewModeChange={handleViewModeChange}
		/>
	</div>

	<!-- Collection grid -->
	<div class="grid-area">
		{#if isLoading}
			<div class="loading-state">
				<Icon name="loader-2" size={32} />
				<p>Loading collection...</p>
			</div>
		{:else if isEmpty}
			<div class="empty-state">
				{#if data.isOwner}
					<Icon name="users" size={48} />
					<h3>Your collection is empty</h3>
					<p>Use the "Add to Collection" button above to get started</p>
				{:else}
					<Icon name="lock" size={48} />
					<p>This collection is empty or private</p>
				{/if}
			</div>
		{:else if currentViewMode === 'grid'}
			<div class="character-grid">
				{#each allCharacters as character (character.id)}
					<CollectionCharacterCard
						{character}
						onClick={() => openCharacterDetails(character)}
					/>
				{/each}
			</div>
		{:else}
			<div class="character-list">
				{#each allCharacters as character (character.id)}
					<CollectionCharacterRow
						{character}
						onClick={() => openCharacterDetails(character)}
					/>
				{/each}
			</div>
		{/if}

		{#if !isLoading && !isEmpty}
			{#if showSentinel}
				<div class="load-more-sentinel" bind:this={sentinelEl}></div>
			{/if}

			{#if collectionQuery.isFetchingNextPage}
				<div class="loading-more">
					<Icon name="loader-2" size={20} />
					<span>Loading more...</span>
				</div>
			{/if}

			{#if !collectionQuery.hasNextPage && allCharacters.length > 0}
				<div class="end-message">
					<p>
						{allCharacters.length} character{allCharacters.length === 1 ? '' : 's'} in {data.isOwner
							? 'your'
							: 'this'} collection
					</p>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;

	.collection-page {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.action-bar {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: $unit-2x;
		flex-wrap: wrap;
	}

	.grid-area {
		min-height: 400px;
	}

	.character-grid {
		display: grid;
		grid-template-columns: repeat(5, 128px);
		justify-content: space-between;
		gap: $unit-4x;
	}

	.character-list {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		color: var(--text-secondary, #666);
		gap: $unit;

		:global(svg) {
			color: var(--icon-secondary, #999);
		}

		p {
			margin: 0;
		}
	}

	.empty-state h3 {
		margin: 0;
		color: var(--text-primary, #333);
	}

	.loading-state :global(svg) {
		animation: spin 1s linear infinite;
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

	.end-message {
		text-align: center;
		padding: $unit-2x;
		color: var(--text-secondary, #666);

		p {
			margin: 0;
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
