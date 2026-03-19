<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { PageData } from './$types'
	import type { CollectionArtifact } from '$lib/types/api/artifact'
	import { getContext, onDestroy, untrack } from 'svelte'
	import { createInfiniteQuery, createQuery } from '@tanstack/svelte-query'
	import { artifactQueries } from '$lib/api/queries/artifact.queries'
	import CollectionArtifactDetailPane from '$lib/components/collection/CollectionArtifactDetailPane.svelte'
	import CollectionArtifactCard from '$lib/components/collection/CollectionArtifactCard.svelte'
	import CollectionArtifactRow from '$lib/components/collection/CollectionArtifactRow.svelte'
	import SelectableCollectionCard from '$lib/components/collection/SelectableCollectionCard.svelte'
	import SelectableCollectionRow from '$lib/components/collection/SelectableCollectionRow.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { collectionFilters } from '$lib/stores/collectionFilters.svelte'
	import { viewMode } from '$lib/stores/viewMode.svelte'
	import type { CollectionSortKey } from '$lib/types/api/collection'
	import Select from '$lib/components/ui/Select.svelte'
	import { getArtifactImage } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import { LOADED_IDS_KEY, type LoadedIdsContext } from '$lib/stores/selectionMode.svelte'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'

	const { data }: { data: PageData } = $props()

	// Get loaded IDs context from layout
	const loadedIdsContext = getContext<LoadedIdsContext | undefined>(LOADED_IDS_KEY)

	// User's element for elemental styling
	const userElement = $derived(
		data.user?.avatar?.element as 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	)

	// Filter state (initialized from localStorage)
	let elementFilters = $state<number[]>(collectionFilters.artifacts.element)
	let proficiencyFilters = $state<number[]>(collectionFilters.artifacts.proficiency)
	let rarityFilter = $state<'all' | 'standard' | 'quirk'>(collectionFilters.artifacts.rarity)

	// Skill filter state - array of modifier IDs per slot (initialized from localStorage)
	let slot1Filters = $state<number[]>(collectionFilters.artifacts.slot1)
	let slot2Filters = $state<number[]>(collectionFilters.artifacts.slot2)
	let slot3Filters = $state<number[]>(collectionFilters.artifacts.slot3)
	let slot4Filters = $state<number[]>(collectionFilters.artifacts.slot4)

	// Sort state
	let sortBy = $state<CollectionSortKey>(collectionFilters.artifacts.sort)

	const sortOptions: { value: CollectionSortKey; label: string }[] = [
		{ value: 'score_desc', label: 'Score ↓' },
		{ value: 'score_asc', label: 'Score ↑' },
		{ value: 'name_asc', label: 'Name A → Z' },
		{ value: 'name_desc', label: 'Name Z → A' },
		{ value: 'element_asc', label: 'Element ↑' },
		{ value: 'element_desc', label: 'Element ↓' }
	]

	// Element options for MultiSelect
	const elementOptions = [
		{ value: 1, label: m.element_wind() },
		{ value: 2, label: m.element_fire() },
		{ value: 3, label: m.element_water() },
		{ value: 4, label: m.element_earth() },
		{ value: 5, label: m.element_dark() },
		{ value: 6, label: m.element_light() }
	]

	// Proficiency options for MultiSelect
	const proficiencyOptions = [
		{ value: 1, label: m.proficiency_sabre() },
		{ value: 2, label: m.proficiency_dagger() },
		{ value: 3, label: m.proficiency_axe() },
		{ value: 4, label: m.proficiency_spear() },
		{ value: 5, label: m.proficiency_bow() },
		{ value: 6, label: m.proficiency_staff() },
		{ value: 7, label: m.proficiency_melee() },
		{ value: 8, label: m.proficiency_harp() },
		{ value: 9, label: m.proficiency_gun() },
		{ value: 10, label: m.proficiency_katana() }
	]

	// Query for artifact skills (cached 1 hour)
	const skillsQuery = createQuery(() => artifactQueries.skills())

	// Build options for each slot's MultiSelect
	// Slots 1-2: group_i, Slot 3: group_ii, Slot 4: group_iii
	const slot1Options = $derived(
		(skillsQuery.data ?? [])
			.filter((s) => s.skillGroup === 'group_i')
			.map((s) => ({ value: s.modifier, label: localizedName(s.name) }))
	)
	const slot2Options = $derived(
		(skillsQuery.data ?? [])
			.filter((s) => s.skillGroup === 'group_i')
			.map((s) => ({ value: s.modifier, label: localizedName(s.name) }))
	)
	const slot3Options = $derived(
		(skillsQuery.data ?? [])
			.filter((s) => s.skillGroup === 'group_ii')
			.map((s) => ({ value: s.modifier, label: localizedName(s.name) }))
	)
	const slot4Options = $derived(
		(skillsQuery.data ?? [])
			.filter((s) => s.skillGroup === 'group_iii')
			.map((s) => ({ value: s.modifier, label: localizedName(s.name) }))
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

	// Persist all filter state to localStorage
	$effect(() => {
		const filters = {
			element: elementFilters,
			proficiency: proficiencyFilters,
			rarity: rarityFilter,
			slot1: slot1Filters,
			slot2: slot2Filters,
			slot3: slot3Filters,
			slot4: slot4Filters,
			sort: sortBy
		}
		untrack(() => collectionFilters.setArtifacts(filters))
	})

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
		skill4: slot4Filters.length > 0 ? slot4Filters : undefined,
		sort: sortBy
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

	function openArtifactDetails(artifact: CollectionArtifact) {
		const artifactName = localizedName(artifact.artifact?.name)

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
	<div class="filters-bar" style:--accent-color={userElement ? `var(--${userElement}-button-bg)` : undefined}>
		<div class="filter-group">
			<Select
				value={rarityFilter}
				onValueChange={(v) => (rarityFilter = v as 'all' | 'standard' | 'quirk')}
				options={[
					{ value: 'all', label: m.collection_filter_all() },
					{ value: 'standard', label: m.collection_filter_standard() },
					{ value: 'quirk', label: m.collection_filter_quirk() }
				]}
				size="small"
			/>

			<MultiSelect
				options={elementOptions}
				bind:value={elementFilters}
				placeholder={m.collection_filter_element()}
				size="small"
			/>
			<MultiSelect
				options={proficiencyOptions}
				bind:value={proficiencyFilters}
				placeholder={m.collection_filter_proficiency()}
				size="small"
			/>

			<MultiSelect
				options={slot1Options}
				bind:value={slot1Filters}
				placeholder={m.collection_filter_slot({ num: 1 })}
				size="small"
			/>
			<MultiSelect
				options={slot2Options}
				bind:value={slot2Filters}
				placeholder={m.collection_filter_slot({ num: 2 })}
				size="small"
			/>
			<MultiSelect
				options={slot3Options}
				bind:value={slot3Filters}
				placeholder={m.collection_filter_slot({ num: 3 })}
				size="small"
			/>
			<MultiSelect
				options={slot4Options}
				bind:value={slot4Filters}
				placeholder={m.collection_filter_slot({ num: 4 })}
				size="small"
			/>

			{#if hasActiveFilters}
				<Button variant="element-ghost" size="small" element={userElement} onclick={clearAllFilters} class="clear-btn">
					{m.filter_clear()}
				</Button>
			{/if}
		</div>

		<div class="right-controls">
			<Select
				value={sortBy}
				onValueChange={(v) => (sortBy = v as CollectionSortKey)}
				options={sortOptions}
				size="small"
			/>
		</div>
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
					<Icon name="gem" size={48} />
					<h3>{m.collection_empty_artifacts()}</h3>
					<p>{m.collection_empty_artifacts_hint()}</p>
				{:else}
					<Icon name="lock" size={48} />
					<p>{m.collection_empty_private()}</p>
				{/if}
			</div>
		{:else if currentViewMode === 'grid'}
			<div class="artifact-grid">
				{#each allArtifacts as artifact, i (i)}
					<SelectableCollectionCard id={artifact.id} onClick={() => openArtifactDetails(artifact)}>
						<CollectionArtifactCard {artifact} />
					</SelectableCollectionCard>
				{/each}
			</div>
		{:else}
			<div class="artifact-list">
				{#each allArtifacts as artifact, i (i)}
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

	.right-controls {
		display: flex;
		align-items: center;
		gap: $unit;
		flex-shrink: 0;
	}

	:global([data-button-root].clear-btn) {
		padding: 6px 12px;
		min-height: 26px;
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
