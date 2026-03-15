
<script lang="ts">
	import Select from '../../ui/Select.svelte'
	import Switch from '../../ui/switch/Switch.svelte'
	import ElementPicker from '../../ui/element-picker/ElementPicker.svelte'
	import RarityPicker from '../../ui/rarity-picker/RarityPicker.svelte'
	import ProficiencyPicker from '../../ui/proficiency-picker/ProficiencyPicker.svelte'
	import Tooltip from '../../ui/Tooltip.svelte'
	import { getProficiencyLabel } from '$lib/utils/proficiency'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		type: 'weapon' | 'character' | 'summon'
		elementFilters: number[]
		rarityFilters: number[]
		proficiencyFilters: number[]
		seriesFilter: string | undefined
		seriesOptions: { value: string; label: string }[]
		requiredProficiencies?: number[]
		/** Localized job name for the proficiency lock tooltip */
		jobName?: string
		/** Whether subaura filter is active (summon type only) */
		subauraFilter?: boolean
		/** Whether the subaura filter is locked on (subaura slots) */
		subauraLocked?: boolean
		onElementChange: (values: number[]) => void
		onRarityChange: (values: number[]) => void
		onProficiencyChange: (values: number[]) => void
		onSeriesChange: (value: string | undefined) => void
		onSubauraChange?: (value: boolean) => void
	}

	let {
		type,
		elementFilters,
		rarityFilters,
		proficiencyFilters,
		seriesFilter,
		seriesOptions,
		requiredProficiencies,
		jobName,
		subauraFilter = false,
		subauraLocked = false,
		onElementChange,
		onRarityChange,
		onProficiencyChange,
		onSeriesChange,
		onSubauraChange
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

	const showProficiency = $derived(type === 'weapon' || type === 'character')
	const isLockedProficiency = $derived(!!requiredProficiencies)

	const lockedProficiencyTooltip = $derived.by(() => {
		if (!requiredProficiencies || !jobName) return ''
		const labels = requiredProficiencies.map(getProficiencyLabel)
		if (labels.length === 2) {
			return m.search_filter_proficiency_locked_two({
				jobName,
				proficiency1: labels[0]!,
				proficiency2: labels[1]!
			})
		}
		return m.search_filter_proficiency_locked_one({
			jobName,
			proficiency1: labels[0]!
		})
	})
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
				{#if !isLockedProficiency && proficiencyFilters.length > 0}
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
			{#if isLockedProficiency}
				<Tooltip content={lockedProficiencyTooltip}>
					<ProficiencyPicker
						value={requiredProficiencies}
						multiple={true}
						contained={true}
						size="small"
						disabled={true}
					/>
				</Tooltip>
			{:else}
				<ProficiencyPicker
					value={proficiencyFilters}
					onValueChange={handleProficiencyChange}
					multiple={true}
					contained={true}
					size="small"
				/>
			{/if}
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

	{#if type === 'summon'}
		<div class="filter-group switch-row">
			<label class="filter-label">{m.extra_summons_subaura()}</label>
			{#if subauraLocked}
				<Tooltip content={m.search_filter_subaura_locked()}>
					<Switch
						checked={subauraFilter}
						size="small"
						disabled={true}
					/>
				</Tooltip>
			{:else}
				<Switch
					checked={subauraFilter}
					size="small"
					onCheckedChange={(v) => onSubauraChange?.(v)}
				/>
			{/if}
		</div>
	{/if}
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

		.switch-row {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			padding: 0 $unit-half;
		}
	}
</style>
