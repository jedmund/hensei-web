
<script lang="ts">
	import Select from '../../ui/Select.svelte'
	import ElementPicker from '../../ui/element-picker/ElementPicker.svelte'
	import RarityPicker from '../../ui/rarity-picker/RarityPicker.svelte'
	import ProficiencyPicker from '../../ui/proficiency-picker/ProficiencyPicker.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		type: 'weapon' | 'character' | 'summon'
		elementFilters: number[]
		rarityFilters: number[]
		proficiencyFilters: number[]
		seriesFilter: string | undefined
		seriesOptions: { value: string; label: string }[]
		requiredProficiencies?: number[]
		onElementChange: (values: number[]) => void
		onRarityChange: (values: number[]) => void
		onProficiencyChange: (values: number[]) => void
		onSeriesChange: (value: string | undefined) => void
	}

	let {
		type,
		elementFilters,
		rarityFilters,
		proficiencyFilters,
		seriesFilter,
		seriesOptions,
		requiredProficiencies,
		onElementChange,
		onRarityChange,
		onProficiencyChange,
		onSeriesChange
	}: Props = $props()

	function handleElementChange(value: number | number[]) {
		onElementChange(Array.isArray(value) ? value : value !== undefined ? [value] : [])
	}

	function handleRarityChange(value: number | number[]) {
		onRarityChange(Array.isArray(value) ? value : value !== undefined ? [value] : [])
	}

	function handleProficiencyChange(value: number | number[]) {
		onProficiencyChange(Array.isArray(value) ? value : value !== undefined ? [value] : [])
	}

	const showProficiency = $derived(
		(type === 'weapon' || type === 'character') && !requiredProficiencies
	)
</script>

<div class="filters-section">
	<div class="filter-row">
		<div class="filter-group">
			<div class="filter-header">
				<label class="filter-label">{m.search_filter_rarity()}</label>
				{#if rarityFilters.length > 0}
					<a
						href="#"
						class="clear-link"
						onclick={(e) => {
							e.preventDefault()
							onRarityChange([])
						}}>{m.search_filter_clear()}</a
					>
				{/if}
			</div>
			<RarityPicker
				value={rarityFilters}
				onValueChange={handleRarityChange}
				multiple={true}
				contained={true}
				size="small"
			/>
		</div>

		<div class="filter-group">
			<div class="filter-header">
				<label class="filter-label">{m.search_filter_element()}</label>
				{#if elementFilters.length > 0}
					<a
						href="#"
						class="clear-link"
						onclick={(e) => {
							e.preventDefault()
							onElementChange([])
						}}>{m.search_filter_clear()}</a
					>
				{/if}
			</div>
			<ElementPicker
				value={elementFilters}
				onValueChange={handleElementChange}
				multiple={true}
				includeAny={true}
				contained={true}
				size="small"
			/>
		</div>
	</div>

	{#if showProficiency}
		<div class="filter-group">
			<div class="filter-header">
				<label class="filter-label">{m.search_filter_proficiency()}</label>
				{#if proficiencyFilters.length > 0}
					<a
						href="#"
						class="clear-link"
						onclick={(e) => {
							e.preventDefault()
							onProficiencyChange([])
						}}>{m.search_filter_clear()}</a
					>
				{/if}
			</div>
			<ProficiencyPicker
				value={proficiencyFilters}
				onValueChange={handleProficiencyChange}
				multiple={true}
				contained={true}
				size="small"
			/>
		</div>
	{/if}

	<div class="filter-group">
		<div class="filter-header">
			<label class="filter-label">{m.search_filter_series()}</label>
			{#if seriesFilter}
				<a
					href="#"
					class="clear-link"
					onclick={(e) => {
						e.preventDefault()
						onSeriesChange(undefined)
					}}>{m.search_filter_clear()}</a
				>
			{/if}
		</div>
		<Select
			options={seriesOptions}
			value={seriesFilter}
			onValueChange={onSeriesChange}
			placeholder={m.search_filter_all_series()}
			contained={true}
			fullWidth={true}
		/>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.filters-section {
		display: flex;
		flex-direction: column;
		gap: calc($unit * 1.5);
		flex-shrink: 0;

		.filter-row {
			display: flex;
			justify-content: space-between;
			gap: $unit;
		}

		.filter-group {
			display: flex;
			flex-direction: column;
			gap: $unit;
		}

		.filter-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0 $unit-half;
		}

		.filter-label {
			display: block;
			font-size: $font-small;
			font-weight: $bold;
			color: var(--text-secondary);
		}

		.clear-link {
			font-size: $font-small;
			color: var(--text-secondary);
			text-decoration: none;
			cursor: pointer;
			transition: 0.15s color ease-out;

			&:hover {
				color: var(--text-primary);
			}
		}
	}
</style>
