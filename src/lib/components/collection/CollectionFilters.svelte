<script lang="ts">
	import { getWeaponProficiencyOptions } from '$lib/utils/proficiency'
	import * as m from '$lib/paraglide/messages'
	import type { CollectionSortKey } from '$lib/types/api/collection'
	import type {
		CollectionFilterConfig,
		CollectionFilterKey,
		CollectionFilterState
	} from '$lib/types/filter'
	import type { ElementType } from '$lib/utils/element'
	import {
		COLLECTION_FILTER_KEYS,
		GENDER_OPTIONS,
		RARITY_OPTIONS,
		SEASON_OPTIONS,
		countSelectedValues,
		emptyCollectionFilterState,
		getCollectionSortOptions,
		getElementFilterOptions,
		getRaceFilterOptions,
		resolveFilterVisibility,
		seriesToOptions,
		splitFilterConfigs,
		type CollectionEntityType,
		type CollectionFilterOption,
		type CollectionFilterVisibility
	} from '$lib/utils/collectionFilterOptions'
	import Button from '$lib/components/ui/Button.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import CollectionFilterSheet from './CollectionFilterSheet.svelte'
	import CollectionMoreFiltersMenu from './CollectionMoreFiltersMenu.svelte'

	interface Props {
		/** Entity type to determine which filters to show */
		entityType?: CollectionEntityType
		elementFilters?: number[]
		rarityFilters?: number[]
		seasonFilters?: number[]
		/** Series filters - number[] for characters, string[] for weapons (UUIDs) */
		seriesFilters?: (number | string)[]
		raceFilters?: number[]
		proficiencyFilters?: number[]
		genderFilters?: number[]
		sortBy?: CollectionSortKey
		onFiltersChange?: (filters: CollectionFilterState) => void
		onSortChange?: (sort: CollectionSortKey) => void
		/** Which filter groups to show (overrides entityType defaults) */
		showFilters?: CollectionFilterVisibility
		/** Whether to show the sort dropdown */
		showSort?: boolean
		/** Element color theme for active toggle state */
		element?: ElementType
		/** Whether to show contained background styling (default: true) */
		contained?: boolean
		/** Whether to show the search input (default: true) */
		showSearch?: boolean
		/** Search query for plaintext name search */
		searchQuery?: string
		/** Whether to show the owned/missing toggle */
		showUnowned?: boolean
		/** Whether unowned (missing) mode is active */
		unowned?: boolean
	}

	let {
		entityType = 'character',
		elementFilters = $bindable([]),
		rarityFilters = $bindable([]),
		seasonFilters = $bindable([]),
		seriesFilters = $bindable([]),
		raceFilters = $bindable([]),
		proficiencyFilters = $bindable([]),
		genderFilters = $bindable([]),
		sortBy = $bindable<CollectionSortKey>('name_asc'),
		onFiltersChange,
		onSortChange,
		showFilters,
		showSort = true,
		element,
		contained = true,
		showSearch = true,
		searchQuery = $bindable(''),
		showUnowned = false,
		unowned = $bindable(false)
	}: Props = $props()

	const effectiveShowFilters = $derived(resolveFilterVisibility(entityType, showFilters))
	const sortOptions = $derived(getCollectionSortOptions(entityType))

	// Static option lists
	const elements = getElementFilterOptions()
	const proficiencies = getWeaponProficiencyOptions()
	const races = getRaceFilterOptions()

	// Series lists from the API, fetched only for the current entity type
	const weaponSeriesQuery = createQuery(() => ({
		...entityQueries.weaponSeriesList(),
		enabled: entityType === 'weapon'
	}))
	const characterSeriesQuery = createQuery(() => ({
		...entityQueries.characterSeriesList(),
		enabled: entityType === 'character'
	}))
	const summonSeriesQuery = createQuery(() => ({
		...entityQueries.summonSeriesList(),
		enabled: entityType === 'summon'
	}))

	const seriesOptions = $derived(
		seriesToOptions(
			entityType === 'character'
				? characterSeriesQuery.data
				: entityType === 'weapon'
					? weaponSeriesQuery.data
					: summonSeriesQuery.data
		)
	)

	// Current values, keyed like CollectionFilterState
	const filterState = $derived<CollectionFilterState>({
		element: elementFilters,
		rarity: rarityFilters,
		season: seasonFilters,
		series: seriesFilters,
		race: raceFilters,
		proficiency: proficiencyFilters,
		gender: genderFilters
	})

	function assignFilters(next: CollectionFilterState) {
		elementFilters = next.element
		rarityFilters = next.rarity
		seasonFilters = next.season
		seriesFilters = next.series
		raceFilters = next.race
		proficiencyFilters = next.proficiency
		genderFilters = next.gender
	}

	function setFilter(key: CollectionFilterKey, value: (number | string)[]) {
		const next = { ...filterState, [key]: value } as CollectionFilterState
		assignFilters(next)
		onFiltersChange?.(next)
	}

	function handleSortChange(value: CollectionSortKey | undefined) {
		if (value) {
			sortBy = value
			onSortChange?.(value)
		}
	}

	function clearAll() {
		const next = emptyCollectionFilterState()
		assignFilters(next)
		searchQuery = ''
		searchExpanded = false
		unowned = false
		onFiltersChange?.(next)
	}

	const hasActiveFilters = $derived(
		Object.values(filterState).some((v) => v.length > 0) || searchQuery.length > 0 || unowned
	)

	// Search expansion state
	let searchExpanded = $state(false)
	let searchInputEl = $state<HTMLInputElement>()

	function collapseSearch() {
		if (searchQuery.length === 0) {
			searchExpanded = false
		}
	}

	// Auto-focus when expanded
	$effect(() => {
		if (searchExpanded && searchInputEl) {
			searchInputEl.focus()
		}
	})

	const optionsByKey = $derived<Record<CollectionFilterKey, CollectionFilterOption[]>>({
		element: elements,
		rarity: RARITY_OPTIONS,
		season: SEASON_OPTIONS,
		series: seriesOptions,
		race: races,
		proficiency: proficiencies,
		gender: GENDER_OPTIONS
	})

	const placeholders = $derived<Record<CollectionFilterKey, string>>({
		element: m.filter_element(),
		rarity: m.filter_rarity(),
		season: m.filter_season(),
		series: m.filter_series(),
		race: m.filter_race(),
		proficiency: m.filter_proficiency(),
		gender: m.filter_gender()
	})

	const filterConfigs = $derived<CollectionFilterConfig[]>(
		COLLECTION_FILTER_KEYS.map((key) => ({
			key,
			options: optionsByKey[key],
			value: filterState[key],
			onChange: (v) => setFilter(key, v),
			placeholder: placeholders[key]
		}))
	)

	// Visible groups: the first few inline, the rest under "More"
	const split = $derived(splitFilterConfigs(filterConfigs, effectiveShowFilters))

	// Mobile filter sheet
	let filterSheetOpen = $state(false)

	const activeFilterCount = $derived(countSelectedValues(split.active))
</script>

<div
	class="filters-container"
	class:contained
	style:--accent-color={element ? `var(--${element}-button-bg)` : undefined}
>
	<div class="filters">
		{#if showSearch}
			{#if searchExpanded}
				<input
					type="text"
					class="search-input"
					placeholder={m.placeholder_search()}
					bind:value={searchQuery}
					bind:this={searchInputEl}
					onblur={collapseSearch}
					onkeydown={(e) => {
						if (e.key === 'Escape') {
							searchQuery = ''
							searchExpanded = false
						}
					}}
				/>
			{:else}
				<Button
					variant="ghost"
					size="small"
					iconOnly
					icon="search"
					onclick={() => (searchExpanded = true)}
				/>
			{/if}
		{/if}

		<!-- Mobile: single filter button -->
		<div class="mobile-filter-trigger">
			<Button variant="ghost" size="small" onclick={() => (filterSheetOpen = true)}>
				{m.filters_title()}
				{#if activeFilterCount > 0}
					<span class="mobile-filter-badge">{activeFilterCount}</span>
				{/if}
			</Button>
		</div>

		<!-- Owned/Missing toggle -->
		{#if showUnowned}
			<div class="ownership-toggle">
				<button
					type="button"
					class="toggle-pill"
					class:active={!unowned}
					onclick={() => (unowned = false)}
				>
					{m.collection_filter_owned()}
				</button>
				<button
					type="button"
					class="toggle-pill"
					class:active={unowned}
					onclick={() => (unowned = true)}
				>
					{m.collection_filter_missing()}
				</button>
			</div>
		{/if}

		<!-- Desktop: inline filter pills -->
		<div class="desktop-filters">
			{#each split.visible as filter (filter.key)}
				<MultiSelect
					options={filter.options}
					value={filter.value}
					onValueChange={filter.onChange}
					placeholder={filter.placeholder}
					size="small"
				/>
			{/each}

			{#if split.more.length > 0}
				<CollectionMoreFiltersMenu filters={split.more} />
			{/if}
		</div>

		{#if hasActiveFilters}
			<Button variant="element-ghost" size="small" {element} onclick={clearAll} class="clear-btn">
				{m.filter_clear()}
			</Button>
		{/if}
	</div>

	<div class="right-controls">
		{#if showSort}
			<div class="sort">
				<Select
					options={sortOptions}
					bind:value={sortBy}
					onValueChange={handleSortChange}
					size="small"
				/>
			</div>
		{/if}
	</div>
</div>

<CollectionFilterSheet
	bind:open={filterSheetOpen}
	filters={split.active}
	onClear={clearAll}
	{element}
/>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/effects' as *;

	.filters-container {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: $unit-2x;
		width: 100%;

		&.contained {
			padding: $unit;
			background: var(--button-contained-bg);
			border-radius: $card-corner;
		}
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: $unit;
	}

	.ownership-toggle {
		display: flex;
		background: var(--input-bg);
		border-radius: $input-corner;
		padding: 2px;
		gap: 2px;
	}

	.toggle-pill {
		all: unset;
		box-sizing: border-box;
		-webkit-font-smoothing: antialiased;
		padding: $unit-half $unit;
		font-size: $font-small;
		font-family: var(--font-family);
		border-radius: calc(#{$input-corner} - 2px);
		cursor: pointer;
		color: var(--text-secondary);
		@include smooth-transition($duration-quick, background-color, color);

		&:hover {
			color: var(--text-primary);
		}

		&.active {
			background: var(--accent-color, var(--accent-blue));
			color: white;
		}

		&:focus-visible {
			outline: 2px solid $blue;
			outline-offset: 2px;
		}
	}

	.desktop-filters {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: $unit;
	}

	.mobile-filter-trigger {
		display: none;
	}

	.mobile-filter-badge {
		background: var(--accent-color, #{$blue});
		color: white;
		font-size: 11px;
		font-weight: $bold;
		min-width: 18px;
		height: 18px;
		border-radius: $full-corner;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0 5px;
		margin-left: $unit-half;
	}

	@media (max-width: 600px) {
		.desktop-filters,
		.right-controls {
			display: none;
		}

		.mobile-filter-trigger {
			display: block;
		}

		.search-input {
			width: 100%;
		}
	}

	.search-input {
		all: unset;
		box-sizing: border-box;
		background-color: var(--input-bg);
		border-radius: $input-corner;
		border: 1px solid transparent;
		color: var(--text-primary);
		font-family: var(--font-family);
		font-size: $font-small;
		padding: $unit-half $unit;
		min-height: calc($unit * 3.5 + 2px);
		width: 140px;
		max-width: 100%;
		@include smooth-transition($duration-quick, background-color, border-color);

		&::placeholder {
			color: var(--text-secondary);
		}

		&:hover {
			background-color: var(--input-bg-hover);
		}

		&:focus {
			border-color: var(--accent-color, var(--accent-blue));
		}
	}

	.right-controls {
		display: flex;
		align-items: center;
		gap: $unit;
		flex-shrink: 0;
	}

	.sort {
		flex-shrink: 0;

		:global([data-select-trigger]) {
			min-width: 128px;
		}
	}

	:global([data-button-root].clear-btn) {
		padding: 6px 12px;
		min-height: 26px;
	}
</style>
