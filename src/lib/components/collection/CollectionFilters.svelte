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
		neutralViewToggle = false
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
					label: s.name.en
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
</script>

<div class="filters-container">
	<div class="filters">
		{#if effectiveShowFilters.element}
			<MultiSelect
				options={elements}
				bind:value={elementFilters}
				onValueChange={handleElementChange}
				placeholder="Element"
				size="small"
			/>
		{/if}

		{#if effectiveShowFilters.rarity}
			<MultiSelect
				options={rarities}
				bind:value={rarityFilters}
				onValueChange={handleRarityChange}
				placeholder="Rarity"
				size="small"
			/>
		{/if}

		{#if effectiveShowFilters.season}
			<MultiSelect
				options={seasons}
				bind:value={seasonFilters}
				onValueChange={handleSeasonChange}
				placeholder="Season"
				size="small"
			/>
		{/if}

		{#if effectiveShowFilters.series}
			<MultiSelect
				options={seriesOptions}
				bind:value={seriesFilters}
				onValueChange={handleSeriesChange}
				placeholder={entityType === 'weapon' ? 'Weapon Series' : 'Series'}
				size="small"
			/>
		{/if}

		{#if effectiveShowFilters.race}
			<MultiSelect
				options={races}
				bind:value={raceFilters}
				onValueChange={handleRaceChange}
				placeholder="Race"
				size="small"
			/>
		{/if}

		{#if effectiveShowFilters.proficiency}
			<MultiSelect
				options={proficiencies}
				bind:value={proficiencyFilters}
				onValueChange={handleProficiencyChange}
				placeholder={entityType === 'weapon' ? 'Weapon Type' : 'Proficiency'}
				size="small"
			/>
		{/if}

		{#if effectiveShowFilters.gender}
			<MultiSelect
				options={genders}
				bind:value={genderFilters}
				onValueChange={handleGenderChange}
				placeholder="Gender"
				size="small"
			/>
		{/if}

		{#if hasActiveFilters}
			<button type="button" class="clear-btn" onclick={clearAll}>Clear</button>
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

		{#if showViewToggle}
			<ViewModeToggle value={viewMode} onValueChange={onViewModeChange} {element} neutral={neutralViewToggle} />
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.filters-container {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: $unit-2x;
		padding: $unit;
		background: var(--button-contained-bg);
		border-radius: $card-corner;
		width: 100%;
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
</style>
