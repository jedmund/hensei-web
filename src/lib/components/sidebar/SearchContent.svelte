<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity'
	import * as m from '$lib/paraglide/messages'
	import type { AddItemResult, SearchMode } from '$lib/types/api/search'
	import { SearchContentState } from './search/searchContentState.svelte'

	import Button from '../ui/Button.svelte'
	import Icon from '../Icon.svelte'
	import Input from '../ui/Input.svelte'
	import SegmentedControl from '../ui/segmented-control/SegmentedControl.svelte'
	import Segment from '../ui/segmented-control/Segment.svelte'

	import Tooltip from '../ui/Tooltip.svelte'
	import SearchResultItem from './search/SearchResultItem.svelte'
	import SearchFiltersPanel from './search/SearchFiltersPanel.svelte'
	import CollectionMemberSelector from './search/CollectionMemberSelector.svelte'
	import UnlinkCollectionDialog from './search/UnlinkCollectionDialog.svelte'

	interface Props {
		type: 'weapon' | 'character' | 'summon'
		onAddItems?: (items: AddItemResult[]) => void
		canAddMore?: boolean
		/** User ID to enable collection search mode */
		authUserId?: string
		/** Required proficiencies for mainhand weapon selection */
		requiredProficiencies?: number[]
		/** Localized job name for proficiency lock tooltip */
		jobName?: string
		/** User's element for styling the collection toggle */
		userElement?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
		/** Callback to unlink all collection items from the party */
		onUnlinkCollection?: () => Promise<void>
		/** Username to pre-populate collection source from an external user */
		initialCollectionSourceUsername?: string
		/** Whether the current slot is a friend summon (hides collection toggle) */
		isFriendSlot?: boolean
		/** Whether the current slot is a subaura summon slot (filters to subaura summons only) */
		isSubauraSlot?: boolean
		/** Whether the current slot is an extra weapon slot (filters to extra-eligible weapons only) */
		isExtraSlot?: boolean
		/** Entity IDs (character/weapon/summon UUIDs) that should appear disabled with the
		 *  "already added" treatment — used by the substitutions flow to prevent adding
		 *  an item that's already a substitute for the slot. */
		excludedIds?: string[]
	}

	let {
		type = 'weapon',
		onAddItems = () => {},
		canAddMore = true,
		authUserId,
		requiredProficiencies,
		jobName,
		userElement,
		onUnlinkCollection,
		initialCollectionSourceUsername,
		isFriendSlot = false,
		isSubauraSlot = false,
		isExtraSlot = false,
		excludedIds = []
	}: Props = $props()

	const excludedIdSet = $derived(new SvelteSet(excludedIds))

	function isExcluded(item: AddItemResult): boolean {
		return excludedIdSet.has(item.id)
	}

	const search = new SearchContentState({
		type: () => type,
		authUserId: () => authUserId,
		requiredProficiencies: () => requiredProficiencies,
		initialCollectionSourceUsername: () => initialCollectionSourceUsername,
		isFriendSlot: () => isFriendSlot,
		isSubauraSlot: () => isSubauraSlot,
		isExtraSlot: () => isExtraSlot
	})

	let unlinkDialogOpen = $state(false)

	// Filter visibility (open by default)
	let filtersOpen = $state(true)

	// Scroll shadow state
	let resultsScrolled = $state(false)

	function handleItemClick(item: AddItemResult) {
		if (canAddMore && !search.isInTeam(item) && !isExcluded(item)) {
			onAddItems([item])
			if (type !== 'weapon') search.clearQuery()
		}
	}
</script>

<div class="search-content">
	<div class="controls" class:scrolled={resultsScrolled}>
		{#if authUserId && !isFriendSlot}
			<div class="mode-toggle">
				<SegmentedControl
					value={search.searchMode}
					onValueChange={(v) => (search.searchMode = v as SearchMode)}
					variant="background"
					size="small"
					element={userElement}
					grow
				>
					<Segment value="all">{m.search_tab_all()}</Segment>
					<Segment value="collection">{m.search_tab_collection()}</Segment>
				</SegmentedControl>
			</div>
		{/if}

		{#if search.showMemberSection}
			<CollectionMemberSelector
				isLocked={search.isCollectionLocked}
				lockedMember={search.lockedMember}
				memberOptions={search.memberOptions}
				selectedMemberId={search.selectedMemberId}
				onMemberChange={(id) => {
					search.selectedMemberId = id
				}}
				onUnlinkRequest={() => {
					unlinkDialogOpen = true
				}}
			/>
		{/if}

		<div class="search-section" class:filters-open={filtersOpen}>
			<Input
				bind:value={search.searchQuery}
				type="text"
				placeholder={m.search_placeholder()}
				leftIcon="search"
				contained
				fullWidth
				class="search-input"
				oncompositionstart={search.handleCompositionStart}
				oncompositionend={search.handleCompositionEnd}
			/>
		</div>

		{#if filtersOpen}
			<SearchFiltersPanel
				{type}
				elementFilters={search.elementFilters}
				rarityFilters={search.rarityFilters}
				proficiencyFilters={search.proficiencyFilters}
				seriesFilter={search.seriesFilter}
				seriesOptions={search.seriesOptions}
				{requiredProficiencies}
				{jobName}
				subauraFilter={search.subauraFilter}
				subauraLocked={isSubauraSlot}
				onElementChange={(v) => {
					search.elementFilters = v
				}}
				onRarityChange={(v) => {
					search.rarityFilters = v
				}}
				onProficiencyChange={(v) => {
					search.proficiencyFilters = v
				}}
				onSeriesChange={(v) => {
					search.seriesFilter = v
				}}
				onSubauraChange={(v) => {
					search.subauraFilter = v
				}}
			/>
		{/if}

		<div class="filters-toggle">
			<Tooltip content={filtersOpen ? m.search_hide_filters() : m.search_show_filters()}>
				<Button
					variant="ghost"
					size="small"
					fullWidth
					onclick={() => {
						filtersOpen = !filtersOpen
					}}
				>
					<Icon name={filtersOpen ? 'chevron-up' : 'chevron-down'} size={14} />
				</Button>
			</Tooltip>
		</div>
	</div>

	<div
		class="results-section"
		onscroll={(e) => {
			resultsScrolled = e.currentTarget.scrollTop > 0
		}}
	>
		{#if search.activeQuery.isLoading}
			<div class="loading">
				<Icon name="loader-2" size={24} />
				<span>{m.search_searching()}</span>
			</div>
		{:else if search.activeQuery.isError}
			<div class="error-state">
				<Icon name="alert-circle" size={24} />
				<p>{search.activeQuery.error?.message || m.search_failed()}</p>
				<Button size="small" onclick={() => search.activeQuery.refetch()}>{m.retry()}</Button>
			</div>
		{:else if search.searchResults.length > 0}
			<ul class="results-list">
				{#each search.searchResults as item (item.collectionId || item.id)}
					{@const inTeam =
						(search.searchMode === 'collection' && search.isInTeam(item)) || isExcluded(item)}
					{@const fromCollection = !!item.collectionId || search.ownedIdSet.has(item.id)}
					<SearchResultItem
						{item}
						{type}
						disabled={!canAddMore}
						{fromCollection}
						{inTeam}
						onclick={handleItemClick}
					/>
				{/each}
			</ul>

			<div
				class="load-more-sentinel"
				bind:this={search.sentinelEl}
				class:hidden={!search.activeQuery.hasNextPage}
			></div>

			{#if search.activeQuery.isFetchingNextPage}
				<div class="loading-more">
					<Icon name="loader-2" size={20} />
					<span>{m.search_loading_more()}</span>
				</div>
			{/if}
		{:else if search.isEmpty}
			<div class="no-results">
				{#if search.searchMode === 'collection'}
					{#if search.searchQuery.length > 0}
						{m.search_no_match()}
					{:else if search.selectedMemberName}
						{m.search_member_empty({ name: search.selectedMemberName })}
					{:else}
						{m.search_collection_empty()}
					{/if}
				{:else if search.searchQuery.length > 0}
					{m.search_no_results()}
				{:else}
					{m.search_start_typing()}
				{/if}
			</div>
		{/if}
	</div>
</div>

<UnlinkCollectionDialog
	bind:open={unlinkDialogOpen}
	onConfirm={async () => {
		if (onUnlinkCollection) await onUnlinkCollection()
	}}
/>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.search-content {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 60px);
		overflow: hidden;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: $unit;
		padding: 0 $unit-2x;
		flex-shrink: 0;
		position: relative;
		z-index: 1;
		transition: box-shadow 0.2s ease;

		&.scrolled {
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
			border-bottom: 1px solid rgba(0, 0, 0, 0.01);
		}

		.search-section {
			&.filters-open {
				margin-bottom: $unit;
			}
		}

		:global(.search-input) {
			border-radius: $card-corner;
		}
	}

	.filters-toggle {
		flex-shrink: 0;
		padding-bottom: $unit-half;
		border-bottom: 1px solid var(--border-primary);

		> :global(span) {
			display: block;
			width: 100%;
		}

		:global(button) {
			justify-content: center;
			color: var(--text-tertiary);
			padding: $unit-half 0;
		}
	}

	.results-section {
		flex: 1;
		overflow-y: auto;
		padding: 0 $unit-2x;
		min-height: 0;

		.loading,
		.no-results {
			text-align: center;
			padding: $unit-3x;
			color: var(--text-secondary);
			font-size: $font-regular;
		}

		.results-list {
			display: flex;
			flex-direction: column;
			gap: $unit-half;
			list-style: none;
			padding: 0;
			margin: 0;
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
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
