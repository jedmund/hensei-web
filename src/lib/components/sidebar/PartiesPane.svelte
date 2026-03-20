<script lang="ts">
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import { onDestroy } from 'svelte'
	import { partyQueries } from '$lib/api/queries/party.queries'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
	import { collectionTeamsPane } from '$lib/stores/collectionTeamsPane.svelte'
	import { filterItemsToParams } from '$lib/utils/filterConversion'
	import ExploreFilters, { type FilterItem } from '$lib/components/explore/ExploreFilters.svelte'
	import GridRep from '$lib/components/reps/GridRep.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getElementLabel } from '$lib/utils/element'

	interface Props {
		/** Primary pinned filter(s) — always present, not user-removable */
		pinnedFilters: FilterItem[]
		/** Default element for initial filter state */
		defaultElement?: number
		/** Filter kinds to exclude from the filter dropdown */
		excludedKinds?: FilterItem['kind'][]
		/** Empty state message override */
		emptyMessage?: string
		/** When true, reads additional entity filters from collectionTeamsPane store
		 *  and manages its open/close lifecycle */
		useCollectionTeamsStore?: boolean
		/** Identity key for resetting user filters when subject changes */
		resetKey: string
	}

	let {
		pinnedFilters,
		defaultElement,
		excludedKinds,
		emptyMessage,
		useCollectionTeamsStore = false,
		resetKey
	}: Props = $props()

	// Mode overrides for pinned entity filters (granblueId → mode)
	// Persists exclude toggles that would otherwise be lost when pinned filters re-derive
	let modeOverrides = $state<Map<string, 'include' | 'exclude'>>(new Map())

	// Build default element filter from defaultElement prop
	function defaultElementFilter(): FilterItem[] {
		if (!defaultElement) return []
		return [{
			kind: 'element' as const,
			value: defaultElement,
			label: getElementLabel(defaultElement)
		}]
	}

	// User-added filters (element, other entities, party settings, etc.)
	let userFilters = $state<FilterItem[]>(defaultElementFilter())

	// Reset user filters when resetKey changes
	let prevResetKey = $state(resetKey)
	$effect(() => {
		if (resetKey !== prevResetKey) {
			prevResetKey = resetKey
			userFilters = defaultElementFilter()
			modeOverrides = new Map()
		}
	})

	// Apply mode overrides to pinned filters
	function applyModeOverrides(filters: FilterItem[]): FilterItem[] {
		return filters.map((f) => {
			if (f.kind === 'entity' && 'granblueId' in f && modeOverrides.has(f.granblueId)) {
				return { ...f, mode: modeOverrides.get(f.granblueId)! }
			}
			return f
		})
	}

	// Track store entities and merge as additional pinned filters (only when useCollectionTeamsStore)
	const storeEntityFilters = $derived<FilterItem[]>(
		useCollectionTeamsStore
			? collectionTeamsPane.entities
					.filter((e): e is FilterItem & { kind: 'entity'; granblueId: string; mode: 'include' | 'exclude' } => {
						if (e.kind !== 'entity') return false
						// Exclude entities that are already in pinnedFilters
						return !pinnedFilters.some(
							(p) => p.kind === 'entity' && 'granblueId' in p && p.granblueId === e.granblueId
						)
					})
					.map((e) => ({
						...e,
						mode: modeOverrides.get(e.granblueId) ?? e.mode,
						pinned: true
					}))
			: []
	)

	// Combined filters: pinned + store entities + user selections
	const allFilters = $derived<FilterItem[]>([
		...applyModeOverrides(pinnedFilters),
		...storeEntityFilters,
		...userFilters
	])

	// Convert to API query params
	const filterParams = $derived(filterItemsToParams(allFilters))

	// Sentinel for infinite scroll
	let sentinelEl = $state<HTMLElement>()

	// Query for parties
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

	// Manage collection teams pane lifecycle
	$effect(() => {
		if (useCollectionTeamsStore) {
			collectionTeamsPane.open()
			return () => {
				collectionTeamsPane.close()
			}
		}
	})

	onDestroy(() => loader.destroy())

	// Flatten results
	const parties = $derived(partiesQuery.data?.pages.flatMap((page) => page.results) ?? [])

	const isEmpty = $derived(
		parties.length === 0 && !partiesQuery.isLoading && !partiesQuery.isError
	)

	function handleFiltersChange(newFilters: FilterItem[]) {
		// Capture mode changes on pinned entity filters before stripping them
		const updated = new Map(modeOverrides)
		for (const f of newFilters) {
			if (f.kind === 'entity' && 'pinned' in f && f.pinned && 'granblueId' in f) {
				updated.set(f.granblueId, f.mode)
			}
		}
		modeOverrides = updated

		// Strip pinned filters — only keep user-added ones
		userFilters = newFilters.filter((f) => !('pinned' in f && f.pinned))
	}
</script>

<div class="parties-pane">
	<!-- Filters -->
	<div class="filters-section">
		<ExploreFilters
			filters={allFilters}
			onFiltersChange={handleFiltersChange}
			{excludedKinds}
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
				<p>{emptyMessage ?? m.sidebar_no_parties()}</p>
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

	.parties-pane {
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
