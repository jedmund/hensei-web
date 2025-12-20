<script lang="ts">
	import type { PageData } from './$types'
	import type { CollectionArtifact } from '$lib/types/api/artifact'
	import { getContext, onDestroy } from 'svelte'
	import { createInfiniteQuery, createQuery } from '@tanstack/svelte-query'
	import { artifactQueries } from '$lib/api/queries/artifact.queries'
	import CollectionArtifactDetailPane from '$lib/components/collection/CollectionArtifactDetailPane.svelte'
	import CollectionArtifactCard from '$lib/components/collection/CollectionArtifactCard.svelte'
	import CollectionArtifactRow from '$lib/components/collection/CollectionArtifactRow.svelte'
	import SelectableCollectionCard from '$lib/components/collection/SelectableCollectionCard.svelte'
	import SelectableCollectionRow from '$lib/components/collection/SelectableCollectionRow.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import ViewModeToggle from '$lib/components/ui/ViewModeToggle.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { viewMode, type ViewMode } from '$lib/stores/viewMode.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import { getArtifactImage } from '$lib/utils/images'
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
	let proficiencyFilters = $state<number[]>([])
	let rarityFilter = $state<'all' | 'standard' | 'quirk'>('all')

	// Skill filter state - array of modifier IDs per slot
	let slot1Filters = $state<number[]>([])
	let slot2Filters = $state<number[]>([])
	let slot3Filters = $state<number[]>([])
	let slot4Filters = $state<number[]>([])

	// Element options for MultiSelect
	const elementOptions = [
		{ value: 1, label: 'Wind' },
		{ value: 2, label: 'Fire' },
		{ value: 3, label: 'Water' },
		{ value: 4, label: 'Earth' },
		{ value: 5, label: 'Dark' },
		{ value: 6, label: 'Light' }
	]

	// Proficiency options for MultiSelect
	const proficiencyOptions = [
		{ value: 1, label: 'Sabre' },
		{ value: 2, label: 'Dagger' },
		{ value: 3, label: 'Axe' },
		{ value: 4, label: 'Spear' },
		{ value: 5, label: 'Bow' },
		{ value: 6, label: 'Staff' },
		{ value: 7, label: 'Melee' },
		{ value: 8, label: 'Harp' },
		{ value: 9, label: 'Gun' },
		{ value: 10, label: 'Katana' }
	]

	// Query for artifact skills (cached 1 hour)
	const skillsQuery = createQuery(() => artifactQueries.skills())

	// Build options for each slot's MultiSelect
	// Slots 1-2: group_i, Slot 3: group_ii, Slot 4: group_iii
	const slot1Options = $derived(
		(skillsQuery.data ?? [])
			.filter((s) => s.skillGroup === 'group_i')
			.map((s) => ({ value: s.modifier, label: s.name.en }))
	)
	const slot2Options = $derived(
		(skillsQuery.data ?? [])
			.filter((s) => s.skillGroup === 'group_i')
			.map((s) => ({ value: s.modifier, label: s.name.en }))
	)
	const slot3Options = $derived(
		(skillsQuery.data ?? [])
			.filter((s) => s.skillGroup === 'group_ii')
			.map((s) => ({ value: s.modifier, label: s.name.en }))
	)
	const slot4Options = $derived(
		(skillsQuery.data ?? [])
			.filter((s) => s.skillGroup === 'group_iii')
			.map((s) => ({ value: s.modifier, label: s.name.en }))
	)

	// Check if any filters are active (for clear button)
	const hasActiveFilters = $derived(
		elementFilters.length > 0 ||
			proficiencyFilters.length > 0 ||
			slot1Filters.length > 0 ||
			slot2Filters.length > 0 ||
			slot3Filters.length > 0 ||
			slot4Filters.length > 0
	)

	function clearAllFilters() {
		elementFilters = []
		proficiencyFilters = []
		slot1Filters = []
		slot2Filters = []
		slot3Filters = []
		slot4Filters = []
	}

	// Sentinel for infinite scroll
	let sentinelEl = $state<HTMLElement>()

	// Build filters for query
	const queryFilters = $derived({
		element: elementFilters.length > 0 ? elementFilters : undefined,
		proficiency: proficiencyFilters.length > 0 ? proficiencyFilters : undefined,
		rarity: rarityFilter !== 'all' ? rarityFilter : undefined,
		skill1: slot1Filters.length > 0 ? slot1Filters : undefined,
		skill2: slot2Filters.length > 0 ? slot2Filters : undefined,
		skill3: slot3Filters.length > 0 ? slot3Filters : undefined,
		skill4: slot4Filters.length > 0 ? slot4Filters : undefined
	})

	// Query for artifacts collection
	const collectionQuery = createInfiniteQuery(() => {
		const userId = data.user.id
		const filters = queryFilters
		return artifactQueries.collection(userId, filters)
	})

	// State-gated infinite scroll (inspired by svelte-infinite)
	// Encapsulates intersection observer, state machine, and all reactive effects
	const loader = useInfiniteLoader(() => collectionQuery, () => sentinelEl)

	// Flatten all artifacts from pages
	const allArtifacts = $derived.by((): CollectionArtifact[] => {
		if (!collectionQuery.data?.pages) {
			return []
		}
		return collectionQuery.data.pages.flatMap((page) => page.results ?? [])
	})

	// Provide loaded IDs to layout for "Select all"
	$effect(() => {
		const ids = allArtifacts.map((a) => a.id)
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
	const isEmpty = $derived(!isLoading && allArtifacts.length === 0)

	// Current view mode from store
	const currentViewMode = $derived(viewMode.collectionView)

	function handleViewModeChange(mode: ViewMode) {
		viewMode.setCollectionView(mode)
	}

	function openArtifactDetails(artifact: CollectionArtifact) {
		const artifactName =
			typeof artifact.artifact?.name === 'string'
				? artifact.artifact.name
				: artifact.artifact?.name?.en || 'Artifact'

		sidebar.openWithComponent(
			artifactName,
			CollectionArtifactDetailPane,
			{
				artifact,
				userId: data.user.id,
				isOwner: data.isOwner,
				onClose: () => sidebar.close()
			},
			{
				image: getArtifactImage(artifact.artifact?.granblueId)
			}
		)
	}
</script>

<div class="collection-page">
	<!-- Filters bar -->
	<div class="filters-bar">
		<div class="filter-group">
			<Select
				value={rarityFilter}
				onValueChange={(v) => (rarityFilter = v as 'all' | 'standard' | 'quirk')}
				options={[
					{ value: 'all', label: 'All' },
					{ value: 'standard', label: 'Standard' },
					{ value: 'quirk', label: 'Quirk' }
				]}
				size="small"
			/>

			<MultiSelect
				options={elementOptions}
				bind:value={elementFilters}
				placeholder="Element"
				size="small"
			/>
			<MultiSelect
				options={proficiencyOptions}
				bind:value={proficiencyFilters}
				placeholder="Proficiency"
				size="small"
			/>

			<MultiSelect
				options={slot1Options}
				bind:value={slot1Filters}
				placeholder="Slot 1"
				size="small"
			/>
			<MultiSelect
				options={slot2Options}
				bind:value={slot2Filters}
				placeholder="Slot 2"
				size="small"
			/>
			<MultiSelect
				options={slot3Options}
				bind:value={slot3Filters}
				placeholder="Slot 3"
				size="small"
			/>
			<MultiSelect
				options={slot4Options}
				bind:value={slot4Filters}
				placeholder="Slot 4"
				size="small"
			/>

			{#if hasActiveFilters}
				<button class="clear-filters-btn" onclick={clearAllFilters}>Clear</button>
			{/if}
		</div>

		<ViewModeToggle value={currentViewMode} onValueChange={handleViewModeChange} element={userElement} />
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
					<Icon name="gem" size={48} />
					<h3>Your artifact collection is empty</h3>
					<p>Artifacts will appear here once added</p>
				{:else}
					<Icon name="lock" size={48} />
					<p>This collection is empty or private</p>
				{/if}
			</div>
		{:else if currentViewMode === 'grid'}
			<div class="artifact-grid">
				{#each allArtifacts as artifact (artifact.id)}
					<SelectableCollectionCard id={artifact.id} onClick={() => openArtifactDetails(artifact)}>
						<CollectionArtifactCard {artifact} />
					</SelectableCollectionCard>
				{/each}
			</div>
		{:else}
			<div class="artifact-list">
				{#each allArtifacts as artifact (artifact.id)}
					<SelectableCollectionRow id={artifact.id} onClick={() => openArtifactDetails(artifact)}>
						<CollectionArtifactRow {artifact} />
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
	@use '$src/themes/layout' as *;

	.collection-page {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.filters-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: $unit-2x;
		padding: $unit;
		background: var(--button-contained-bg);
		border-radius: $card-corner;
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: $unit;
		flex-wrap: wrap;
	}

	.clear-filters-btn {
		background: none;
		border: none;
		padding: $unit-half $unit;
		font-size: $font-small;
		font-weight: $medium;
		color: var(--accent-color);
		cursor: pointer;

		&:hover {
			text-decoration: underline;
		}
	}

	.grid-area {
		min-height: 400px;
	}

	.artifact-grid {
		display: grid;
		grid-template-columns: repeat(5, 139px);
		justify-content: space-between;
		gap: $unit-4x $unit-2x;
	}

	.artifact-list {
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
