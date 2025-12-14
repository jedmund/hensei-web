<script lang="ts">
	import type { PageData } from './$types'
	import type { CollectionArtifact } from '$lib/types/api/artifact'
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import { artifactQueries } from '$lib/api/queries/artifact.queries'
	import CollectionArtifactDetailPane from '$lib/components/collection/CollectionArtifactDetailPane.svelte'
	import CollectionArtifactCard from '$lib/components/collection/CollectionArtifactCard.svelte'
	import CollectionArtifactRow from '$lib/components/collection/CollectionArtifactRow.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import ViewModeToggle from '$lib/components/ui/ViewModeToggle.svelte'
	import { IsInViewport } from 'runed'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { viewMode, type ViewMode } from '$lib/stores/viewMode.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import { getArtifactImage } from '$lib/utils/images'

	const { data }: { data: PageData } = $props()

	// Filter state
	let elementFilters = $state<number[]>([])
	let rarityFilter = $state<'all' | 'standard' | 'quirk'>('all')

	// Sentinel for infinite scroll
	let sentinelEl = $state<HTMLElement>()

	// Build filters for query
	const queryFilters = $derived({
		element: elementFilters.length > 0 ? elementFilters : undefined,
		rarity: rarityFilter !== 'all' ? rarityFilter : undefined
	})

	// Query for artifacts collection
	const collectionQuery = createInfiniteQuery(() => {
		const userId = data.user.id
		const filters = queryFilters
		return artifactQueries.collection(userId, filters)
	})

	// Flatten all artifacts from pages
	const allArtifacts = $derived.by((): CollectionArtifact[] => {
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
	const isEmpty = $derived(!isLoading && allArtifacts.length === 0)
	const showSentinel = $derived(collectionQuery.hasNextPage && !collectionQuery.isFetchingNextPage)

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

		<ViewModeToggle
			value={currentViewMode}
			onValueChange={handleViewModeChange}
			neutral={true}
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
					<CollectionArtifactCard
						{artifact}
						onClick={() => openArtifactDetails(artifact)}
					/>
				{/each}
			</div>
		{:else}
			<div class="artifact-list">
				{#each allArtifacts as artifact (artifact.id)}
					<CollectionArtifactRow
						{artifact}
						onClick={() => openArtifactDetails(artifact)}
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

			{#if !collectionQuery.hasNextPage && allArtifacts.length > 0}
				<div class="end-message">
					<p>
						{allArtifacts.length} artifact{allArtifacts.length === 1 ? '' : 's'} in {data.isOwner
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
	}

	.grid-area {
		min-height: 400px;
	}

	.artifact-grid {
		display: grid;
		grid-template-columns: repeat(5, 100px);
		justify-content: space-between;
		gap: $unit-4x;
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
