<script lang="ts">
	/**
	 * RaidPartiesPane - Shows parties that use a specific raid
	 *
	 * Displays a filterable list of public parties for a given raid.
	 * Uses ExploreFilters with a pinned raid filter for consistency
	 * with the gallery/explore page filtering experience.
	 */
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import { onDestroy } from 'svelte'
	import type { Raid } from '$lib/types/api/entities'
	import { partyQueries } from '$lib/api/queries/party.queries'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
	import { filterItemsToParams } from '$lib/utils/filterConversion'
	import ExploreFilters, { type FilterItem } from '$lib/components/explore/ExploreFilters.svelte'
	import GridRep from '$lib/components/reps/GridRep.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import * as m from '$lib/paraglide/messages'
	import { localizedName } from '$lib/utils/locale'
	import { getElementLabel } from '$lib/utils/element'

	interface Props {
		raid: Raid
		/** Fallback element when raid.element is null (e.g. party's element) */
		partyElement?: number
	}

	let { raid, partyElement }: Props = $props()

	// Pinned raid filter — always present, not removable
	// Uses raid.id (UUID) because the API filters by raid_id column directly
	const pinnedRaidFilter: FilterItem = $derived({
		kind: 'raid',
		value: raid.id,
		label: localizedName(raid.name) ?? raid.slug,
		pinned: true
	})

	// Build default element filter from the party's mainhand element
	// (raid element is the enemy's element, not what you fight with)
	function defaultElementFilter(): FilterItem[] {
		if (!partyElement) return []
		return [{
			kind: 'element' as const,
			value: partyElement,
			label: getElementLabel(partyElement)
		}]
	}

	// User-added filters (element, entity, party settings, etc.)
	let userFilters = $state<FilterItem[]>(defaultElementFilter())

	// Reset user filters when raid changes
	let prevRaidId = raid.id
	$effect(() => {
		if (raid.id !== prevRaidId) {
			prevRaidId = raid.id
			userFilters = defaultElementFilter()
		}
	})

	// Combined filters: pinned raid + user selections
	const allFilters = $derived<FilterItem[]>([pinnedRaidFilter, ...userFilters])

	// Convert to API query params
	const filterParams = $derived(filterItemsToParams(allFilters))

	// Sentinel for infinite scroll
	let sentinelEl = $state<HTMLElement>()

	// Query for parties using the shared list endpoint
	const partiesQuery = createInfiniteQuery(() =>
		partyQueries.list({ filters: filterParams })
	)

	// Infinite loader
	const loader = useInfiniteLoader(
		() => partiesQuery,
		() => sentinelEl,
		{ rootMargin: '200px' }
	)

	// Reset loader when filters change
	$effect(() => {
		void filterParams
		loader.reset()
	})

	onDestroy(() => loader.destroy())

	// Flatten results
	const parties = $derived(partiesQuery.data?.pages.flatMap((page) => page.results) ?? [])

	const isEmpty = $derived(
		parties.length === 0 && !partiesQuery.isLoading && !partiesQuery.isError
	)

	function handleFiltersChange(newFilters: FilterItem[]) {
		// Strip pinned filters — only keep user-added ones
		userFilters = newFilters.filter((f) => !f.pinned)
	}
</script>

<div class="raid-parties-pane">
	<!-- Filters -->
	<div class="filters-section">
		<ExploreFilters
			filters={allFilters}
			onFiltersChange={handleFiltersChange}
			excludedKinds={['raid']}
			contained
		/>
	</div>

	<!-- Party list -->
	<div class="parties-list">
		{#if partiesQuery.isLoading && parties.length === 0}
			<div class="loading-state">
				<Icon name="loader-2" size={24} />
				<span>{m.sidebar_loading_parties()}</span>
			</div>
		{:else if partiesQuery.isError}
			<div class="error-state">
				<Icon name="alert-circle" size={24} />
				<p>{m.sidebar_parties_error()}</p>
				<button type="button" onclick={() => partiesQuery.refetch()}>{m.retry()}</button>
			</div>
		{:else if isEmpty}
			<div class="empty-state">
				<p>{m.sidebar_no_parties()}</p>
			</div>
		{:else}
			<div class="parties-grid">
				{#each parties as party (party.id)}
					<GridRep {party} />
				{/each}
			</div>

			<div
				class="load-more-sentinel"
				bind:this={sentinelEl}
				class:hidden={!partiesQuery.hasNextPage}
			></div>

			{#if partiesQuery.isFetchingNextPage}
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
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.raid-parties-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.filters-section {
		display: flex;
		flex-direction: column;
		gap: $unit;
		padding: $unit-2x;
		background: var(--sidebar-bg);
		border-bottom: 1px solid var(--border-subtle);
		flex-shrink: 0;

		// Reduce aura spread to fit in sidebar
		:global(.filter-trigger::before),
		:global(.filter-input-wrapper::before) {
			inset: -3px !important;
			filter: blur(6px) !important;
		}

		// Disable breathe animation in sidebar
		:global(.filter-trigger:hover::before),
		:global(.filter-input-wrapper::before) {
			animation-name: none !important;
		}

		// Full-width dropdown
		:global(.dropdown) {
			width: 100%;
		}
	}

	.parties-list {
		display: flex;
		flex-direction: column;
		gap: $unit;
		flex: 1;
		overflow-y: auto;
		padding: $unit-2x;
		background: var(--page-bg);
	}

	.parties-grid {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.loading-state,
	.empty-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: $unit;
		padding: $unit-4x;
		color: var(--text-tertiary);
	}

	.error-state button {
		padding: $unit $unit-2x;
		border: 1px solid var(--border-subtle);
		border-radius: $input-corner;
		background: var(--button-bg);
		cursor: pointer;
		color: var(--text-primary);

		&:hover {
			background: var(--button-bg-hover);
		}
	}

	.load-more-sentinel {
		height: 1px;

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
