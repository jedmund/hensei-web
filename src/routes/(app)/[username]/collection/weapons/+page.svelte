<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { PageData } from './$types'
	import type { CollectionWeapon, CollectionSortKey } from '$lib/types/api/collection'
	import { getContext, onDestroy, untrack } from 'svelte'
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { collectionQueries } from '$lib/api/queries/collection.queries'
	import CollectionFilters, {
		type CollectionFilterState
	} from '$lib/components/collection/CollectionFilters.svelte'
	import CollectionWeaponPane from '$lib/components/collection/CollectionWeaponPane.svelte'
	import CollectionWeaponCard from '$lib/components/collection/CollectionWeaponCard.svelte'
	import CollectionWeaponRow from '$lib/components/collection/CollectionWeaponRow.svelte'
	import CollectionContextMenu from '$lib/components/collection/CollectionContextMenu.svelte'
	import PartiesPane from '$lib/components/sidebar/PartiesPane.svelte'
	import SelectableCollectionCard from '$lib/components/collection/SelectableCollectionCard.svelte'
	import SelectableCollectionRow from '$lib/components/collection/SelectableCollectionRow.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { collectionFilters } from '$lib/stores/collectionFilters.svelte'
	import { collectionTeamsPane } from '$lib/stores/collectionTeamsPane.svelte'
	import { viewMode } from '$lib/stores/viewMode.svelte'
	import { LOADED_IDS_KEY, type LoadedIdsContext } from '$lib/stores/selectionMode.svelte'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
	import { localizedName } from '$lib/utils/locale'
	import { canAccessDatabase, getDatabaseUrl } from '$lib/utils/database'
	import { getElementKey } from '$lib/utils/element'
	import type { ElementType } from '$lib/stores/paneStack.svelte'
	import type { FilterItem } from '$lib/types/filter'

	const { data }: { data: PageData } = $props()

	// Get loaded IDs context from layout
	const loadedIdsContext = getContext<LoadedIdsContext | undefined>(LOADED_IDS_KEY)

	// User's element for elemental styling
	const userElement = $derived(
		data.user?.avatar?.element as 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	)

	// Filter state (initialized from localStorage)
	let elementFilters = $state<number[]>(collectionFilters.weapons.element)
	let rarityFilters = $state<number[]>(collectionFilters.weapons.rarity)
	let proficiencyFilters = $state<number[]>(collectionFilters.weapons.proficiency)
	let seriesFilters = $state<(number | string)[]>(collectionFilters.weapons.series)
	let searchQuery = $state('')

	// Sort state (initialized from localStorage)
	let sortBy = $state<CollectionSortKey>(collectionFilters.weapons.sort)

	// Sentinel for infinite scroll
	let sentinelEl = $state<HTMLElement>()

	// Build filters for query
	const queryFilters = $derived({
		element: elementFilters.length > 0 ? elementFilters : undefined,
		rarity: rarityFilters.length > 0 ? rarityFilters : undefined,
		proficiency: proficiencyFilters.length > 0 ? proficiencyFilters : undefined,
		series: seriesFilters.length > 0 ? seriesFilters : undefined,
		search: searchQuery.length > 0 ? searchQuery : undefined,
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

	// Persist all filter and sort state to localStorage
	$effect(() => {
		const filters = {
			element: elementFilters,
			rarity: rarityFilters,
			proficiency: proficiencyFilters,
			series: seriesFilters,
			sort: sortBy
		}
		untrack(() => collectionFilters.setWeapons(filters))
	})

	// Derived state for context menu
	const canAccessDb = $derived(canAccessDatabase($page.data.account?.role))
	const isTeamsPaneOpen = $derived(collectionTeamsPane.isOpen)


	function openWeaponDetails(weapon: CollectionWeapon) {
		const weaponName = localizedName(weapon.weapon?.name)

		sidebar.openWithComponent(weaponName, CollectionWeaponPane, {
			weapon,
			isOwner: data.isOwner,
			onClose: () => sidebar.close()
		})
	}

	function openWeaponEdit(weapon: CollectionWeapon) {
		const weaponName = localizedName(weapon.weapon?.name)

		sidebar.openWithComponent(weaponName, CollectionWeaponPane, {
			weapon,
			isOwner: data.isOwner,
			initialEdit: true,
			onClose: () => sidebar.close()
		})
	}

	function viewTeamsWithWeapon(weapon: CollectionWeapon) {
		const weaponData = weapon.weapon
		if (!weaponData) return

		const entityFilter: FilterItem = {
			kind: 'entity',
			value: weaponData.granblueId,
			label: localizedName(weaponData.name) ?? weaponData.granblueId,
			entityType: 'weapon',
			granblueId: weaponData.granblueId,
			mode: 'include',
			element: weaponData.element,
			pinned: true
		}

		collectionTeamsPane.reset(entityFilter)

		const weaponName = localizedName(weaponData.name)
		const elementName = weaponData.element ? getElementKey(weaponData.element) as ElementType : undefined

		sidebar.openWithComponent(weaponName, PartiesPane, {
			pinnedFilters: [entityFilter],
			defaultElement: weaponData.element,
			useCollectionTeamsStore: true,
			resetKey: weaponData.granblueId
		}, { scrollable: true, element: elementName })
	}

	function addWeaponToTeamsView(weapon: CollectionWeapon) {
		const weaponData = weapon.weapon
		if (!weaponData) return

		collectionTeamsPane.addEntity({
			kind: 'entity',
			value: weaponData.granblueId,
			label: localizedName(weaponData.name) ?? weaponData.granblueId,
			entityType: 'weapon',
			granblueId: weaponData.granblueId,
			mode: 'include',
			element: weaponData.element
		})
	}

	function viewWeaponInDatabase(weapon: CollectionWeapon) {
		const weaponData = weapon.weapon
		if (!weaponData) return
		goto(getDatabaseUrl('weapon', weaponData.granblueId))
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
			bind:searchQuery
			bind:sortBy
			onFiltersChange={handleFiltersChange}
			element={userElement}
		/>
	</div>

	<!-- Collection grid -->
	<div class="grid-area">
		{#if isLoading}
			<div class="loading-state">
				<Icon name="loader-2" size={32} />
				<p>{m.collection_loading()}</p>
			</div>
		{:else if isEmpty}
			<div class="empty-state">
				{#if data.isOwner}
					<Icon name="sword" size={48} />
					<h3>{m.collection_empty_weapons()}</h3>
					<p>{m.collection_empty_weapons_hint()}</p>
				{:else}
					<Icon name="lock" size={48} />
					<p>{m.collection_empty_private()}</p>
				{/if}
			</div>
		{:else if currentViewMode === 'grid'}
			<div class="weapon-grid">
				{#each allWeapons as weapon, i (i)}
					<CollectionContextMenu
						itemType="weapon"
						onView={() => openWeaponDetails(weapon)}
						onEdit={() => openWeaponEdit(weapon)}
						canEdit={data.isOwner}
						{isTeamsPaneOpen}
						onViewTeams={() => viewTeamsWithWeapon(weapon)}
						onAddToTeamsView={() => addWeaponToTeamsView(weapon)}
						{canAccessDb}
						onViewInDatabase={() => viewWeaponInDatabase(weapon)}
					>
						<SelectableCollectionCard id={weapon.id} onClick={() => openWeaponDetails(weapon)}>
							<CollectionWeaponCard {weapon} />
						</SelectableCollectionCard>
					</CollectionContextMenu>
				{/each}
			</div>
		{:else}
			<div class="weapon-list">
				{#each allWeapons as weapon, i (i)}
					<CollectionContextMenu
						itemType="weapon"
						onView={() => openWeaponDetails(weapon)}
						onEdit={() => openWeaponEdit(weapon)}
						canEdit={data.isOwner}
						{isTeamsPaneOpen}
						onViewTeams={() => viewTeamsWithWeapon(weapon)}
						onAddToTeamsView={() => addWeaponToTeamsView(weapon)}
						{canAccessDb}
						onViewInDatabase={() => viewWeaponInDatabase(weapon)}
					>
						<SelectableCollectionRow id={weapon.id} onClick={() => openWeaponDetails(weapon)}>
							<CollectionWeaponRow {weapon} />
						</SelectableCollectionRow>
					</CollectionContextMenu>
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
					<span>{m.loading_more()}</span>
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
