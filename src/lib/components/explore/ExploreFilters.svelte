<script lang="ts">
	import type { RaidFull } from '$lib/types/api/raid'
	import type { FilterItem } from '$lib/types/filter'
	import ExploreFilterPill from './ExploreFilterPill.svelte'
	import ExploreGearSheet from './ExploreGearSheet.svelte'
	import FilterDropdown from './FilterDropdown.svelte'
	import { ExploreFilterSearch } from './exploreFilterSearch.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import * as m from '$lib/paraglide/messages'
	import type { ElementType } from '$lib/utils/element'
	import type { ExploreSort } from '$lib/utils/exploreFilterParams'
	import { MediaQuery } from 'svelte/reactivity'

	interface Props {
		filters: FilterItem[]
		onFiltersChange: (filters: FilterItem[]) => void
		excludedKinds?: FilterItem['kind'][]
		/** Use when placed on a card/white surface — gives the pill a visible background */
		contained?: boolean
		allRaids?: RaidFull[]
		/** Mobile-only: Gallery order, shown in the gear sheet when given */
		sort?: ExploreSort | undefined
		onSortChange?: (sort: ExploreSort) => void
		/** Mobile-only: collection filter state */
		collectionFilterActive?: boolean
		onCollectionFilterChange?: (active: boolean) => void
		/** Mobile-only: open the advanced filters modal */
		onAdvancedFiltersOpen?: () => void
		/** User's element for theming */
		element?: ElementType
		/** Whether the user is authenticated (controls collection filter visibility) */
		isAuthenticated?: boolean
		/** Evoking Solomonis route Evokers to offer as filters (granblue_id + name) */
		evokerOptions?: { value: string; label: string }[]
	}

	let {
		filters = $bindable([]),
		onFiltersChange,
		excludedKinds = [],
		contained = false,
		allRaids = [],
		evokerOptions = [],
		sort,
		onSortChange,
		collectionFilterActive = $bindable(false),
		onCollectionFilterChange,
		onAdvancedFiltersOpen,
		element,
		isAuthenticated = false
	}: Props = $props()

	const isMobile = new MediaQuery('(max-width: 768px)')

	const search = new ExploreFilterSearch({
		getFilters: () => filters,
		commit: (next) => {
			filters = next
			onFiltersChange(filters)
		},
		getExcludedKinds: () => excludedKinds,
		getAllRaids: () => allRaids,
		getEvokerOptions: () => evokerOptions
	})

	let containerEl = $state<HTMLDivElement>()

	// Mobile gear sheet state
	let gearSheetOpen = $state(false)

	function handleWindowClick(e: MouseEvent) {
		const target = e.target as Node
		if (!target.isConnected) return
		if (containerEl && !containerEl.contains(target)) {
			search.close()
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

{#snippet pills()}
	{#each filters as filter, i (i)}
		<ExploreFilterPill
			label={filter.label}
			kind={filter.kind}
			mode={filter.kind === 'entity' ? filter.mode : undefined}
			element={filter.kind === 'entity'
				? filter.element
				: filter.kind === 'element'
					? filter.value
					: undefined}
			pinned={filter.pinned}
			onRemove={() => search.removeFilter(i)}
			onToggleMode={() => search.toggleEntityMode(i)}
		/>
	{/each}
{/snippet}

{#snippet dropdown()}
	{#if search.dropdownOpen}
		<FilterDropdown
			inputValue={search.inputValue}
			isSearching={search.isSearching}
			placeholderSuggestions={search.placeholderSuggestions}
			displayResults={search.displayResults}
			selectedIndex={search.selectedIndex}
			onSelectedIndexChange={(i) => (search.selectedIndex = i)}
			onSelectOption={search.selectOption}
			onSuggestionClick={search.selectSuggestion}
		/>
	{/if}
{/snippet}

<div
	class="explore-filters"
	class:contained
	class:mobile={isMobile.current}
	bind:this={containerEl}
>
	{#if isMobile.current}
		<!-- Mobile layout: full-width input + gear button -->
		<div class="mobile-filter-row">
			<div class="mobile-input-wrapper">
				<Input
					leftIcon="search"
					placeholder={m.explore_filter_placeholder_mobile()}
					bind:value={search.inputValue}
					fullWidth
					size="medium"
					onfocus={search.open}
					onkeydown={search.handleKeydown}
					oncompositionstart={search.handleCompositionStart}
					oncompositionend={search.handleCompositionEnd}
				/>
			</div>
			<Button
				icon="gear"
				iconOnly
				shape="circle"
				variant="subtle"
				onclick={() => (gearSheetOpen = true)}
				aria-label={m.explore_settings_aria()}
			/>
		</div>

		{#if filters.length > 0}
			<div class="mobile-pills-row">
				{@render pills()}
			</div>
		{/if}

		{@render dropdown()}

		<ExploreGearSheet
			bind:open={gearSheetOpen}
			bind:collectionFilterActive
			{sort}
			{onSortChange}
			{isAuthenticated}
			{onCollectionFilterChange}
			{onAdvancedFiltersOpen}
			{element}
		/>
	{:else}
		<!-- Desktop layout: existing filter trigger + inline pills -->
		<div class="filter-row">
			{#if search.dropdownOpen}
				<div class="filter-input-wrapper">
					<input
						bind:this={search.inputEl}
						bind:value={search.inputValue}
						type="text"
						class="filter-input"
						placeholder={m.explore_filter_placeholder()}
						onkeydown={search.handleKeydown}
						oncompositionstart={search.handleCompositionStart}
						oncompositionend={search.handleCompositionEnd}
					/>
				</div>
			{:else}
				<button type="button" class="filter-trigger" onclick={search.open}>
					<span>{m.explore_filter()}</span>
					<Icon name="plus" size={9} />
				</button>

				{#if filters.length === 0}
					<span class="tagline">{m.explore_filter_tagline()}</span>
				{/if}
			{/if}

			{@render pills()}
		</div>

		{@render dropdown()}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	@property --aura-angle {
		syntax: '<angle>';
		initial-value: 180deg;
		inherits: false;
	}

	// Blurred conic gradient behind the trigger and the open input
	@mixin aura {
		content: '';
		position: absolute;
		inset: -6px;
		border-radius: $full-corner;
		background: conic-gradient(
			from var(--aura-angle, 180deg),
			var(--aura-1),
			var(--aura-2),
			var(--aura-3),
			var(--aura-4),
			var(--aura-5),
			var(--aura-1)
		);
	}

	.explore-filters {
		position: relative;

		&.mobile {
			width: 100%;
		}

		// Aura gradient colors — bright pastels for light, muted for dark
		--aura-1: #f9c4d2;
		--aura-2: #b8e6d0;
		--aura-3: #b3d4f7;
		--aura-4: #e0b3f7;
		--aura-5: #f7d6b3;

		:global(html[data-theme='dark']) & {
			--aura-1: #7a3a4a;
			--aura-2: #2a5a3f;
			--aura-3: #2a4a6a;
			--aura-4: #5a2a6a;
			--aura-5: #6a4a2a;
		}
	}

	.filter-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: $unit;
	}

	.tagline {
		font-size: $font-small;
		color: var(--text-secondary);
	}

	.filter-trigger {
		all: unset;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: $unit-half;
		padding: calc($unit-half + 1px) $unit;
		border-radius: $full-corner;
		font-size: $font-small;
		color: var(--text-primary);
		position: relative;

		// Gradient aura (behind everything)
		&::before {
			@include aura;
			opacity: 0;
			z-index: $z-base;
			filter: blur(12px);
			@include smooth-transition($duration-quick, opacity);
		}

		// White pill background (above gradient, below text)
		&::after {
			content: '';
			position: absolute;
			inset: 0;
			border-radius: inherit;
			background: var(--card-bg);
			z-index: $z-raised;
		}

		&:hover::before {
			opacity: 0.8;
			animation:
				spin-aura 8s linear infinite,
				breathe-aura 6s ease-in-out infinite;
		}

		// Ensure text and icon sit above the ::after background
		:global(> *) {
			position: relative;
			z-index: $z-badge;
		}

		:global(.icon) {
			color: var(--text-secondary);
		}

		.contained & {
			&::after {
				border: 1px solid var(--stroked-button-border);
			}
		}
	}

	@keyframes spin-aura {
		to {
			--aura-angle: 540deg;
		}
	}

	@keyframes breathe-aura {
		0%,
		100% {
			inset: -6px;
			filter: blur(12px);
		}
		50% {
			inset: -14px;
			filter: blur(20px);
		}
	}

	.filter-input-wrapper {
		position: relative;
		display: inline-flex;
		border-radius: $full-corner;

		// Gradient aura (same as filter-trigger)
		&::before {
			@include aura;
			opacity: 0.8;
			z-index: $z-base;
			filter: blur(12px);
			animation:
				spin-aura 8s linear infinite,
				breathe-aura 6s ease-in-out infinite;
		}

		// White pill background with stroke
		&::after {
			content: '';
			position: absolute;
			inset: 0;
			border-radius: inherit;
			background: var(--card-bg);
			box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.01);
			z-index: $z-raised;
		}

		.contained & {
			&::after {
				border: 1px solid var(--stroked-button-border);
			}
		}
	}

	.filter-input {
		all: unset;
		padding: calc($unit-half + 1px) $unit;
		border-radius: $full-corner;
		font-size: $font-small;
		color: var(--text-primary);
		min-width: 120px;
		box-sizing: border-box;
		position: relative;
		z-index: $z-badge;

		&::placeholder {
			color: var(--text-tertiary);
		}
	}

	// Mobile layout styles
	.mobile-filter-row {
		display: flex;
		align-items: center;
		gap: $unit;
	}

	.mobile-input-wrapper {
		flex: 1;
		min-width: 0;

		:global(.fieldset .input) {
			min-height: calc($unit * 5.5);
		}
	}

	.mobile-pills-row {
		display: flex;
		flex-wrap: wrap;
		gap: $unit-half;
		margin-top: $unit;
	}
</style>
