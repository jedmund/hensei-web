<script lang="ts">
	import { CHARACTER_SEASON_NAMES, CHARACTER_SERIES_NAMES } from '$lib/types/enums'
	import { RACE_LABELS } from '$lib/utils/race'
	import { GENDER_LABELS } from '$lib/utils/gender'

	interface Props {
		elementFilters?: number[]
		rarityFilters?: number[]
		seasonFilters?: number[]
		seriesFilters?: number[]
		raceFilters?: number[]
		proficiencyFilters?: number[]
		genderFilters?: number[]
		onFiltersChange?: (filters: CollectionFilterState) => void
		/** Which filter groups to show */
		showFilters?: {
			element?: boolean
			rarity?: boolean
			season?: boolean
			series?: boolean
			race?: boolean
			proficiency?: boolean
			gender?: boolean
		}
		/** Layout mode */
		layout?: 'horizontal' | 'vertical'
	}

	export interface CollectionFilterState {
		element: number[]
		rarity: number[]
		season: number[]
		series: number[]
		race: number[]
		proficiency: number[]
		gender: number[]
	}

	let {
		elementFilters = $bindable([]),
		rarityFilters = $bindable([]),
		seasonFilters = $bindable([]),
		seriesFilters = $bindable([]),
		raceFilters = $bindable([]),
		proficiencyFilters = $bindable([]),
		genderFilters = $bindable([]),
		onFiltersChange,
		showFilters = {
			element: true,
			rarity: true,
			season: true,
			series: true,
			race: true,
			proficiency: true,
			gender: true
		},
		layout = 'horizontal'
	}: Props = $props()

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
		{ value: 3, label: 'Spear' },
		{ value: 4, label: 'Axe' },
		{ value: 5, label: 'Staff' },
		{ value: 6, label: 'Gun' },
		{ value: 7, label: 'Melee' },
		{ value: 8, label: 'Bow' },
		{ value: 9, label: 'Harp' },
		{ value: 10, label: 'Katana' }
	]

	// Convert record maps to arrays for iteration
	const seasons = Object.entries(CHARACTER_SEASON_NAMES).map(([value, label]) => ({
		value: Number(value),
		label
	}))

	const series = Object.entries(CHARACTER_SERIES_NAMES).map(([value, label]) => ({
		value: Number(value),
		label
	}))

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

	function toggleFilter(
		current: number[],
		value: number,
		setter: (val: number[]) => void
	) {
		if (current.includes(value)) {
			setter(current.filter((v) => v !== value))
		} else {
			setter([...current, value])
		}
		emitChange()
	}

	function toggleElement(value: number) {
		toggleFilter(elementFilters, value, (v) => (elementFilters = v))
	}

	function toggleRarity(value: number) {
		toggleFilter(rarityFilters, value, (v) => (rarityFilters = v))
	}

	function toggleSeason(value: number) {
		toggleFilter(seasonFilters, value, (v) => (seasonFilters = v))
	}

	function toggleSeries(value: number) {
		toggleFilter(seriesFilters, value, (v) => (seriesFilters = v))
	}

	function toggleRace(value: number) {
		toggleFilter(raceFilters, value, (v) => (raceFilters = v))
	}

	function toggleProficiency(value: number) {
		toggleFilter(proficiencyFilters, value, (v) => (proficiencyFilters = v))
	}

	function toggleGender(value: number) {
		toggleFilter(genderFilters, value, (v) => (genderFilters = v))
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

<div class="filters" class:horizontal={layout === 'horizontal'} class:vertical={layout === 'vertical'}>
	{#if showFilters.element}
		<div class="filter-group" role="group" aria-label="Element filters">
			<span class="filter-label">Element</span>
			<div class="filter-buttons">
				{#each elements as element}
					<button
						type="button"
						class="filter-btn element-btn"
						class:active={elementFilters.includes(element.value)}
						style="--element-color: {element.color}"
						onclick={() => toggleElement(element.value)}
						aria-pressed={elementFilters.includes(element.value)}
					>
						{element.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if showFilters.rarity}
		<div class="filter-group" role="group" aria-label="Rarity filters">
			<span class="filter-label">Rarity</span>
			<div class="filter-buttons">
				{#each rarities as rarity}
					<button
						type="button"
						class="filter-btn"
						class:active={rarityFilters.includes(rarity.value)}
						onclick={() => toggleRarity(rarity.value)}
						aria-pressed={rarityFilters.includes(rarity.value)}
					>
						{rarity.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if showFilters.season}
		<div class="filter-group" role="group" aria-label="Season filters">
			<span class="filter-label">Season</span>
			<div class="filter-buttons">
				{#each seasons as season}
					<button
						type="button"
						class="filter-btn"
						class:active={seasonFilters.includes(season.value)}
						onclick={() => toggleSeason(season.value)}
						aria-pressed={seasonFilters.includes(season.value)}
					>
						{season.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if showFilters.series}
		<div class="filter-group" role="group" aria-label="Series filters">
			<span class="filter-label">Series</span>
			<div class="filter-buttons wrap">
				{#each series as s}
					<button
						type="button"
						class="filter-btn"
						class:active={seriesFilters.includes(s.value)}
						onclick={() => toggleSeries(s.value)}
						aria-pressed={seriesFilters.includes(s.value)}
					>
						{s.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if showFilters.race}
		<div class="filter-group" role="group" aria-label="Race filters">
			<span class="filter-label">Race</span>
			<div class="filter-buttons">
				{#each races as race}
					<button
						type="button"
						class="filter-btn"
						class:active={raceFilters.includes(race.value)}
						onclick={() => toggleRace(race.value)}
						aria-pressed={raceFilters.includes(race.value)}
					>
						{race.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if showFilters.proficiency}
		<div class="filter-group" role="group" aria-label="Proficiency filters">
			<span class="filter-label">Proficiency</span>
			<div class="filter-buttons proficiency-grid">
				{#each proficiencies as prof}
					<button
						type="button"
						class="filter-btn"
						class:active={proficiencyFilters.includes(prof.value)}
						onclick={() => toggleProficiency(prof.value)}
						aria-pressed={proficiencyFilters.includes(prof.value)}
					>
						{prof.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if showFilters.gender}
		<div class="filter-group" role="group" aria-label="Gender filters">
			<span class="filter-label">Gender</span>
			<div class="filter-buttons">
				{#each genders as gender}
					<button
						type="button"
						class="filter-btn"
						class:active={genderFilters.includes(gender.value)}
						onclick={() => toggleGender(gender.value)}
						aria-pressed={genderFilters.includes(gender.value)}
					>
						{gender.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if hasActiveFilters}
		<button type="button" class="clear-btn" onclick={clearAll}>
			Clear filters
		</button>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.filters {
		display: flex;
		gap: $unit-2x;

		&.horizontal {
			flex-wrap: wrap;
			align-items: flex-start;
		}

		&.vertical {
			flex-direction: column;
		}
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
	}

	.filter-label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--text-secondary, #666);
		letter-spacing: 0.5px;
	}

	.filter-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;

		&.wrap {
			max-width: 400px;
		}

		&.proficiency-grid {
			display: grid;
			grid-template-columns: repeat(5, 1fr);
			gap: 4px;
		}
	}

	.filter-btn {
		padding: 4px 8px;
		border: 1px solid var(--border-color, #ddd);
		background: var(--button-bg, white);
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.15s ease;
		color: var(--text-primary, #333);
		white-space: nowrap;

		&:hover {
			background: var(--button-bg-hover, #f5f5f5);
		}

		&.active {
			background: var(--accent-color, #3366ff);
			color: white;
			border-color: var(--accent-color, #3366ff);
		}

		&.element-btn.active {
			background: var(--element-color);
			border-color: var(--element-color);
		}
	}

	.clear-btn {
		padding: 4px 12px;
		border: 1px solid var(--border-color, #ddd);
		background: transparent;
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
		color: var(--text-secondary, #666);
		align-self: flex-end;

		&:hover {
			background: var(--button-bg-hover, #f5f5f5);
			color: var(--text-primary, #333);
		}
	}
</style>
