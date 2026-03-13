<script lang="ts">
	import { CHARACTER_SEASON_NAMES, CHARACTER_SERIES_NAMES } from '$lib/types/enums'
	import { RACE_LABELS } from '$lib/utils/race'
	import { GENDER_LABELS } from '$lib/utils/gender'
	import type { CollectionSortKey } from '$lib/types/api/collection'
	import type { ViewMode } from '$lib/stores/viewMode.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import ViewModeToggle from '$lib/components/ui/ViewModeToggle.svelte'
	import { createQuery, queryOptions } from '@tanstack/svelte-query'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import { localizedName } from '$lib/utils/locale'
	import { DropdownMenu } from 'bits-ui'
	import Icon from '$lib/components/Icon.svelte'

	type EntityType = 'character' | 'weapon' | 'summon'

	interface Props {
		/** Entity type to determine which filters to show */
		entityType?: EntityType
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
		showFilters?: {
			element?: boolean
			rarity?: boolean
			season?: boolean
			series?: boolean
			race?: boolean
			proficiency?: boolean
			gender?: boolean
		}
		/** Whether to show the sort dropdown */
		showSort?: boolean
		/** Current view mode */
		viewMode?: ViewMode
		/** Callback when view mode changes */
		onViewModeChange?: (mode: ViewMode) => void
		/** Whether to show the view toggle */
		showViewToggle?: boolean
		/** Element color theme for active toggle state */
		element?: string
		/** Use neutral gray styling for view toggle */
		neutralViewToggle?: boolean
		/** Whether to show contained background styling (default: true) */
		contained?: boolean
	}

	export interface CollectionFilterState {
		element: number[]
		rarity: number[]
		season: number[]
		/** Series filters - number[] for characters, string[] for weapons (UUIDs) */
		series: (number | string)[]
		race: number[]
		proficiency: number[]
		gender: number[]
	}

	// Default filter visibility based on entity type
	const defaultFiltersByEntity: Record<EntityType, Props['showFilters']> = {
		character: {
			element: true,
			rarity: true,
			season: true,
			series: true,
			race: true,
			proficiency: true,
			gender: true
		},
		weapon: {
			element: true,
			rarity: true,
			season: false,
			series: true, // Weapon series
			race: false,
			proficiency: true, // Weapon type
			gender: false
		},
		summon: {
			element: true,
			rarity: true,
			season: false,
			series: false,
			race: false,
			proficiency: false,
			gender: false
		}
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
		viewMode = 'grid',
		onViewModeChange,
		showViewToggle = false,
		element,
		neutralViewToggle = false,
		contained = true
	}: Props = $props()

	// Compute effective filter visibility (explicit showFilters overrides entityType defaults)
	const effectiveShowFilters = $derived({
		...defaultFiltersByEntity[entityType],
		...showFilters
	})

	// Sort options
	const sortOptions: { value: CollectionSortKey; label: string }[] = [
		{ value: 'name_asc', label: 'Name A → Z' },
		{ value: 'name_desc', label: 'Name Z → A' },
		{ value: 'element_asc', label: 'Element ↑' },
		{ value: 'element_desc', label: 'Element ↓' },
		{ value: 'proficiency_asc', label: 'Proficiency ↑' },
		{ value: 'proficiency_desc', label: 'Proficiency ↓' }
	]

	// Constants
	const elements = [
		{ value: 0, label: 'Null', color: '#888' },
		{ value: 1, label: 'Wind', color: '#4A9B3F' },
		{ value: 2, label: 'Fire', color: '#D94444' },
		{ value: 3, label: 'Water', color: '#4A7FB8' },
		{ value: 4, label: 'Earth', color: '#9B6E3F' },
		{ value: 5, label: 'Dark', color: '#6B3E9B' },
		{ value: 6, label: 'Light', color: '#F4B643' }
	]

	const rarities = [
		{ value: 1, label: 'R' },
		{ value: 2, label: 'SR' },
		{ value: 3, label: 'SSR' }
	]

	const proficiencies = [
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

	// Fetch weapon series from API (only when entityType is weapon)
	const weaponSeriesQuery = createQuery(() =>
		queryOptions({
			queryKey: ['weaponSeries', 'list'] as const,
			queryFn: () => entityAdapter.getWeaponSeriesList(),
			enabled: entityType === 'weapon',
			staleTime: 1000 * 60 * 60, // 1 hour
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		})
	)

	// Convert record maps to arrays for iteration
	const seasons = Object.entries(CHARACTER_SEASON_NAMES).map(([value, label]) => ({
		value: Number(value),
		label
	}))

	// Character series (hardcoded enum)
	const characterSeries = Object.entries(CHARACTER_SERIES_NAMES).map(([value, label]) => ({
		value: Number(value),
		label
	}))

	// Build series options based on entity type
	// For weapons: use API-fetched series with string IDs
	// For characters: use hardcoded enum with number values
	const seriesOptions = $derived.by(() => {
		if (entityType === 'weapon' && weaponSeriesQuery.data) {
			return weaponSeriesQuery.data
				.sort((a, b) => a.order - b.order)
				.map((s) => ({
					value: s.id,
					label: localizedName(s.name)
				}))
		}
		return characterSeries
	})

	const races = Object.entries(RACE_LABELS)
		.filter(([value]) => Number(value) !== 0) // Exclude Unknown
		.map(([value, label]) => ({
			value: Number(value),
			label
		}))

	const genders = Object.entries(GENDER_LABELS)
		.filter(([value]) => Number(value) !== 0) // Exclude Unknown
		.map(([value, label]) => ({
			value: Number(value),
			label
		}))

	function emitChange() {
		onFiltersChange?.({
			element: elementFilters,
			rarity: rarityFilters,
			season: seasonFilters,
			series: seriesFilters,
			race: raceFilters,
			proficiency: proficiencyFilters,
			gender: genderFilters
		})
	}

	function handleElementChange(value: number[]) {
		elementFilters = value
		emitChange()
	}

	function handleRarityChange(value: number[]) {
		rarityFilters = value
		emitChange()
	}

	function handleSeasonChange(value: number[]) {
		seasonFilters = value
		emitChange()
	}

	function handleSeriesChange(value: (number | string)[]) {
		seriesFilters = value
		emitChange()
	}

	function handleRaceChange(value: number[]) {
		raceFilters = value
		emitChange()
	}

	function handleProficiencyChange(value: number[]) {
		proficiencyFilters = value
		emitChange()
	}

	function handleGenderChange(value: number[]) {
		genderFilters = value
		emitChange()
	}

	function handleSortChange(value: CollectionSortKey | undefined) {
		if (value) {
			sortBy = value
			onSortChange?.(value)
		}
	}

	function clearAll() {
		elementFilters = []
		rarityFilters = []
		seasonFilters = []
		seriesFilters = []
		raceFilters = []
		proficiencyFilters = []
		genderFilters = []
		emitChange()
	}

	const hasActiveFilters = $derived(
		elementFilters.length > 0 ||
			rarityFilters.length > 0 ||
			seasonFilters.length > 0 ||
			seriesFilters.length > 0 ||
			raceFilters.length > 0 ||
			proficiencyFilters.length > 0 ||
			genderFilters.length > 0
	)

	// Overflow detection state
	type FilterKey = 'element' | 'rarity' | 'season' | 'series' | 'race' | 'proficiency' | 'gender'

	interface FilterConfig {
		key: FilterKey
		options: { value: number | string; label: string; color?: string }[]
		value: (number | string)[]
		onChange: (value: (number | string)[]) => void
		placeholder: string
	}

	// Filters that always go in the "More" dropdown
	const moreFilterKeys: FilterKey[] = ['race', 'gender']

	// Unified filter configuration
	const filterConfigs = $derived<FilterConfig[]>([
		{
			key: 'element',
			options: elements,
			value: elementFilters,
			onChange: (v) => handleElementChange(v as number[]),
			placeholder: 'Element'
		},
		{
			key: 'rarity',
			options: rarities,
			value: rarityFilters,
			onChange: (v) => handleRarityChange(v as number[]),
			placeholder: 'Rarity'
		},
		{
			key: 'season',
			options: seasons,
			value: seasonFilters,
			onChange: (v) => handleSeasonChange(v as number[]),
			placeholder: 'Season'
		},
		{
			key: 'series',
			options: seriesOptions,
			value: seriesFilters,
			onChange: (v) => handleSeriesChange(v),
			placeholder: 'Series'
		},
		{
			key: 'race',
			options: races,
			value: raceFilters,
			onChange: (v) => handleRaceChange(v as number[]),
			placeholder: 'Race'
		},
		{
			key: 'proficiency',
			options: proficiencies,
			value: proficiencyFilters,
			onChange: (v) => handleProficiencyChange(v as number[]),
			placeholder: 'Proficiency'
		},
		{
			key: 'gender',
			options: genders,
			value: genderFilters,
			onChange: (v) => handleGenderChange(v as number[]),
			placeholder: 'Gender'
		}
	])

	// Active filters based on visibility settings
	const activeFilters = $derived(filterConfigs.filter((f) => effectiveShowFilters[f.key]))

	// Filters visible in the main row (not in moreFilterKeys)
	const visibleFilters = $derived(activeFilters.filter((f) => !moreFilterKeys.includes(f.key)))

	// Filters in the "More" dropdown
	const moreFilters = $derived(activeFilters.filter((f) => moreFilterKeys.includes(f.key)))

	const showMoreButton = $derived(moreFilters.length > 0)

	// Toggle function for submenu multi-select behavior
	function toggleFilterValue(filter: FilterConfig, value: number | string) {
		const currentValues = filter.value
		const newValues = currentValues.includes(value)
			? currentValues.filter((v) => v !== value)
			: [...currentValues, value]

		filter.onChange(newValues)
	}
</script>

<div class="filters-container" class:contained>
	<div class="filters">
		{#each visibleFilters as filter (filter.key)}
			<MultiSelect
				options={filter.options}
				value={filter.value}
				onValueChange={filter.onChange}
				placeholder={filter.placeholder}
				size="small"
			/>
		{/each}

		{#if showMoreButton}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="more-trigger">
					<span>More</span>
					<Icon name="chevron-down-small" size={14} />
				</DropdownMenu.Trigger>

				<DropdownMenu.Portal>
					<DropdownMenu.Content
						class="more-menu-content"
						side="bottom"
						align="start"
						sideOffset={4}
					>
						{#each moreFilters as filter (filter.key)}
							<DropdownMenu.Sub>
								<DropdownMenu.SubTrigger class="more-menu-subtrigger">
									<span class="submenu-label">{filter.placeholder}</span>
									{#if filter.value.length > 0}
										<span class="selection-badge">{filter.value.length}</span>
									{/if}
									<Icon name="chevron-right-small" size={14} class="submenu-chevron" />
								</DropdownMenu.SubTrigger>

								<DropdownMenu.SubContent class="submenu-content">
									{#each filter.options as option (option.value)}
										{@const isSelected = filter.value.includes(option.value)}
										<DropdownMenu.Item
											class="submenu-item {isSelected ? 'selected' : ''}"
											onSelect={(e) => {
												e.preventDefault()
												toggleFilterValue(filter, option.value)
											}}
										>
											{#if option.color}
												<span class="color-dot" style="background: {option.color}"></span>
											{/if}
											<span class="item-label" class:selected={isSelected}>{option.label}</span>
											{#if isSelected}
												<Icon name="check" size={14} class="check-icon" />
											{/if}
										</DropdownMenu.Item>
									{/each}
								</DropdownMenu.SubContent>
							</DropdownMenu.Sub>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		{/if}
	</div>

	<div class="right-controls">
		{#if hasActiveFilters}
			<button type="button" class="clear-btn" onclick={clearAll}>Clear</button>
		{/if}
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

		{#if showViewToggle}
			<ViewModeToggle
				value={viewMode}
				onValueChange={onViewModeChange}
				{element}
				neutral={neutralViewToggle}
			/>
		{/if}
	</div>
</div>

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

	.clear-btn {
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

	// More button trigger - matches MultiSelect trigger styling
	:global(.more-trigger) {
		all: unset;
		box-sizing: border-box;
		-webkit-font-smoothing: antialiased;
		display: inline-flex;
		align-items: center;
		gap: $unit-half;
		padding: $unit-half $unit;
		font-size: $font-small;
		font-family: var(--font-family);
		min-height: $unit-3x;
		color: var(--text-tertiary);
		background-color: var(--input-bg);
		border-radius: $input-corner;
		border: 1px solid transparent;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;

		&:hover {
			background-color: var(--input-bg-hover);
		}

		&:focus-visible {
			outline: 2px solid $blue;
			outline-offset: 2px;
		}

		:global(svg) {
			flex-shrink: 0;
			color: var(--text-tertiary);
		}
	}

	// More dropdown content
	:global(.more-menu-content) {
		background: var(--dialog-bg);
		border-radius: $card-corner;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: var(--shadow-lg);
		padding: $unit-half;
		min-width: calc($unit * 18);
		z-index: $z-popover;
		animation: fadeIn 0.15s ease-out;

		@keyframes fadeIn {
			from {
				opacity: 0;
				transform: translateY(-4px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}

	// Submenu trigger
	:global(.more-menu-subtrigger) {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit calc($unit * 1.5);
		border-radius: $item-corner-small;
		cursor: pointer;
		font-size: $font-small;
		color: var(--text-primary);
		transition: background-color 0.1s ease;

		&:hover,
		&[data-highlighted] {
			background: var(--option-bg-hover);
		}

		.submenu-label {
			flex: 1;
		}

		.selection-badge {
			background: var(--accent-color, #{$blue});
			color: white;
			font-size: 11px;
			font-weight: $medium;
			padding: 2px 6px;
			border-radius: $full-corner;
			min-width: 18px;
			text-align: center;
		}

		:global(.submenu-chevron) {
			color: var(--text-tertiary);
			margin-left: auto;
		}
	}

	// Submenu content
	:global(.submenu-content) {
		background: var(--dialog-bg);
		border-radius: $card-corner;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: var(--shadow-lg);
		padding: $unit-half;
		min-width: calc($unit * 16);
		max-height: 280px;
		overflow: auto;
		z-index: $z-popover + 1;
	}

	// Submenu items
	:global(.submenu-item) {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit calc($unit * 1.5);
		border-radius: $item-corner-small;
		cursor: pointer;
		font-size: $font-small;
		color: var(--text-primary);
		transition: background-color 0.1s ease;

		&:hover,
		&[data-highlighted] {
			background: var(--option-bg-hover);
		}

		&.selected {
			.item-label {
				font-weight: $medium;
			}
		}

		.color-dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			flex-shrink: 0;
		}

		.item-label {
			flex: 1;
		}

		:global(.check-icon) {
			color: var(--accent-color);
			margin-left: auto;
		}
	}
</style>
