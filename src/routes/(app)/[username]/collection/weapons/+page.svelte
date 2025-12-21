<script lang="ts">
	import type { PageData } from './$types'
	import type { CollectionWeapon, CollectionSortKey } from '$lib/types/api/collection'
	import { getContext, onDestroy } from 'svelte'
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import { collectionQueries } from '$lib/api/queries/collection.queries'
	import CollectionFilters, {
		type CollectionFilterState
	} from '$lib/components/collection/CollectionFilters.svelte'
	import CollectionWeaponPane from '$lib/components/collection/CollectionWeaponPane.svelte'
	import CollectionWeaponCard from '$lib/components/collection/CollectionWeaponCard.svelte'
	import CollectionWeaponRow from '$lib/components/collection/CollectionWeaponRow.svelte'
	import SelectableCollectionCard from '$lib/components/collection/SelectableCollectionCard.svelte'
	import SelectableCollectionRow from '$lib/components/collection/SelectableCollectionRow.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { viewMode, type ViewMode } from '$lib/stores/viewMode.svelte'
	import { LOADED_IDS_KEY, type LoadedIdsContext } from '$lib/stores/selectionMode.svelte'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'

	const { data }: { data: PageData } = $props()

	// Get loaded IDs context from layout
	const loadedIdsContext = getContext<LoadedIdsContext | undefined>(LOADED_IDS_KEY)

	// User's element for elemental styling
	const userElement = $derived(
		data.user?.avatar?.element as 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	)

	// Filter state
	let elementFilters = $state<number[]>([])
	let rarityFilters = $state<number[]>([])
	let proficiencyFilters = $state<number[]>([])
	let seriesFilters = $state<(number | string)[]>([])

	// Sort state
	let sortBy = $state<CollectionSortKey>('name_asc')

	// Sentinel for infinite scroll
	let sentinelEl = $state<HTMLElement>()

	// Build filters for query
	const queryFilters = $derived({
		element: elementFilters.length > 0 ? elementFilters : undefined,
		rarity: rarityFilters.length > 0 ? rarityFilters : undefined,
		proficiency: proficiencyFilters.length > 0 ? proficiencyFilters : undefined,
		series: seriesFilters.length > 0 ? seriesFilters : undefined,
		sort: sortBy
	})

	// Query for weapons collection
	const collectionQuery = createInfiniteQuery(() => {
		const userId = data.user.id
		const filters = queryFilters
		return collectionQueries.weapons(userId, filters)
	})

	// State-gated infinite scroll (inspired by svelte-infinite)
	// Encapsulates intersection observer, state machine, and all reactive effects
	const loader = useInfiniteLoader(() => collectionQuery, () => sentinelEl)

	// Flatten all weapons from pages
	const allWeapons = $derived.by((): CollectionWeapon[] => {
		if (!collectionQuery.data?.pages) {
			return []
		}
		return collectionQuery.data.pages.flatMap((page) => page.results ?? [])
	})

	// Provide loaded IDs to layout for "Select all"
	$effect(() => {
		const ids = allWeapons.map((w) => w.id)
		loadedIdsContext?.setIds(ids)
	})

	// Reset loader state when filters change
	$effect(() => {
		void queryFilters
		loader.reset()
	})

	// Cleanup on destroy
	onDestroy(() => loader.destroy())

	const isLoading = $derived(collectionQuery.isLoading)
	const isEmpty = $derived(!isLoading && allWeapons.length === 0)

	// Current view mode from store
	const currentViewMode = $derived(viewMode.collectionView)

	function handleFiltersChange(filters: CollectionFilterState) {
		elementFilters = filters.element
		rarityFilters = filters.rarity
		proficiencyFilters = filters.proficiency
		seriesFilters = filters.series
	}

	function handleViewModeChange(mode: ViewMode) {
		viewMode.setCollectionView(mode)
	}

	function openWeaponDetails(weapon: CollectionWeapon) {
		const weaponName =
			typeof weapon.weapon?.name === 'string'
				? weapon.weapon.name
				: weapon.weapon?.name?.en || 'Weapon'

		sidebar.openWithComponent(weaponName, CollectionWeaponPane, {
			weapon,
			isOwner: data.isOwner,
			onClose: () => sidebar.close()
		})
	}
</script>

<div class="collection-page">
	<!-- Action bar -->
	<div class="action-bar">
		<CollectionFilters
			entityType="weapon"
			bind:elementFilters
			bind:rarityFilters
			bind:proficiencyFilters
			bind:seriesFilters
			bind:sortBy
			onFiltersChange={handleFiltersChange}
			showViewToggle={true}
			viewMode={currentViewMode}
			onViewModeChange={handleViewModeChange}
			element={userElement}
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
					<Icon name="sword" size={48} />
					<h3>Your weapon collection is empty</h3>
					<p>Use the "Add weapons" button above to get started</p>
				{:else}
					<Icon name="lock" size={48} />
					<p>This collection is empty or private</p>
				{/if}
			</div>
		{:else if currentViewMode === 'grid'}
			<div class="weapon-grid">
				{#each allWeapons as weapon, i (i)}
					<SelectableCollectionCard id={weapon.id} onClick={() => openWeaponDetails(weapon)}>
						<CollectionWeaponCard {weapon} />
					</SelectableCollectionCard>
				{/each}
			</div>
		{:else}
			<div class="weapon-list">
				{#each allWeapons as weapon, i (i)}
					<SelectableCollectionRow id={weapon.id} onClick={() => openWeaponDetails(weapon)}>
						<CollectionWeaponRow {weapon} />
					</SelectableCollectionRow>
				{/each}
			</div>
		{/if}

		{#if !isLoading && !isEmpty}
			<!-- Sentinel always in DOM to avoid Svelte block tracking issues during rapid updates -->
			<div
				class="load-more-sentinel"
				bind:this={sentinelEl}
				class:hidden={!collectionQuery.hasNextPage}
			></div>

			{#if collectionQuery.isFetchingNextPage}
				<div class="loading-more">
					<Icon name="loader-2" size={20} />
					<span>Loading more...</span>
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

	.weapon-grid {
		display: grid;
		grid-template-columns: repeat(5, 144px);
		justify-content: space-between;
		gap: $unit-4x $unit-2x;
	}

	.weapon-list {
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
		color: var(--text-secondary, #666);

		:global(svg) {
			animation: spin 1s linear infinite;
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
