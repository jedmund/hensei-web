<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import CollectionFilters from './CollectionFilters.svelte'
	import AddToCollectionResults from './AddToCollectionResults.svelte'
	import { AddToCollectionState } from './addToCollectionState.svelte'
	import {
		entityNames,
		selectedText,
		type AddToCollectionEntityType
	} from './add-to-collection.utils'
	import { viewMode } from '$lib/stores/viewMode.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		userId: string
		entityType?: AddToCollectionEntityType
		open?: boolean
		onOpenChange?: (open: boolean) => void
		/** User's element for elemental checkbox styling */
		userElement?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	}

	let {
		userId,
		entityType = 'character',
		open = $bindable(false),
		onOpenChange,
		userElement
	}: Props = $props()

	const add = new AddToCollectionState({
		userId: () => userId,
		entityType: () => entityType,
		open: () => open
	})

	// Refs
	let resultsAreaEl = $state<HTMLElement>()
	let footerShadow = $state(false)

	function handleResultsScroll() {
		if (!resultsAreaEl) return
		const { scrollTop, scrollHeight, clientHeight } = resultsAreaEl
		footerShadow = scrollTop + clientHeight < scrollHeight - 1
	}

	// Re-check shadow when results change
	$effect(() => {
		void add.displayedResults
		requestAnimationFrame(handleResultsScroll)
	})

	async function handleAdd() {
		if (await add.add()) {
			open = false
			onOpenChange?.(false)
		}
	}

	const names = $derived(entityNames(entityType))
	const dialogTitle = $derived(m.collection_add_title({ type: names.plural }))
	const footerText = $derived(
		selectedText(entityType, { count: add.selectedCount, itemCount: add.selectedItemCount }, names)
	)
</script>

<Dialog bind:open {onOpenChange} size="large">
	<ModalHeader title={dialogTitle} />
	<div class="modal-content">
		<!-- Filters -->
		<div class="filters-bar">
			<CollectionFilters
				{entityType}
				bind:elementFilters={add.elementFilters}
				bind:rarityFilters={add.rarityFilters}
				bind:seasonFilters={add.seasonFilters}
				bind:seriesFilters={add.seriesFilters}
				bind:raceFilters={add.raceFilters}
				bind:proficiencyFilters={add.proficiencyFilters}
				bind:genderFilters={add.genderFilters}
				bind:searchQuery={add.searchQuery}
				onFiltersChange={add.setFilters}
				showSort={false}
			/>
		</div>

		<!-- Results -->
		<div class="results-area" bind:this={resultsAreaEl} onscroll={handleResultsScroll}>
			{#if add.isLoading}
				<div class="loading-state">
					<Icon name="loader-2" size={32} />
					<p>{m.collection_add_loading({ type: names.plural })}</p>
				</div>
			{:else if add.displayedResults.length === 0}
				<div class="empty-state">
					{#if add.showOnlySelected}
						<p>{m.collection_add_none_selected({ type: names.plural })}</p>
						<Button variant="ghost" size="small" onclick={add.toggleShowSelected}>
							{m.collection_add_show_all({ type: names.plural })}
						</Button>
					{:else if add.hasActiveSearch}
						<p>{m.collection_add_no_results({ type: names.plural })}</p>
					{:else}
						<p>{m.collection_add_search_prompt({ type: names.plural })}</p>
					{/if}
				</div>
			{:else}
				<AddToCollectionResults
					{entityType}
					results={add.displayedResults}
					view={viewMode.modalView}
					selectedIds={add.selectedIds}
					quantities={add.selectedQuantities}
					onToggle={add.toggleCharacter}
					onQuantityChange={add.setQuantity}
					{userElement}
				/>
			{/if}

			{#if add.displayedResults.length > 0}
				<div
					class="load-more-sentinel"
					bind:this={add.sentinelEl}
					class:hidden={add.showOnlySelected || !add.hasNextPage}
				></div>

				{#if add.isFetchingNextPage}
					<div class="loading-more">
						<Icon name="loader-2" size={20} />
						<span>{m.loading_more()}</span>
					</div>
				{/if}
			{/if}
		</div>
	</div>
	<ModalFooter
		onCancel={() => (open = false)}
		showShadow={footerShadow}
		{userElement}
		primaryAction={{
			label: add.isAdding ? m.collection_adding() : m.collection_add_button(),
			onclick: handleAdd,
			disabled: add.selectedCount === 0 || add.isAdding
		}}
	>
		{#snippet left()}
			{#if add.selectedCount > 0}
				<Button
					variant="ghost"
					size="small"
					active={add.showOnlySelected}
					onclick={add.toggleShowSelected}
				>
					{footerText}
				</Button>
			{/if}
		{/snippet}
	</ModalFooter>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as layout;

	.modal-content {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow: hidden;
		padding: 0 $unit-2x;
	}

	.filters-bar {
		overflow-x: auto;
	}

	.results-area {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: var(--text-secondary);
		gap: $unit;

		:global(svg) {
			animation: spin 1s linear infinite;
		}

		p {
			margin: 0;
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
