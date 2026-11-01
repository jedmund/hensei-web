<!--
  Filter row for DataTable, driven by a FilterConfig list (see filters.ts).
  Reads and writes the table URL; facet counts come from the source.
-->
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Button from '$lib/components/ui/Button.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import {
		activeFilterCount,
		applyMulti,
		applyRecent,
		applyToggles,
		labelText,
		matchRecent,
		multiTriggerText,
		multiValue,
		resolveOptions,
		toggleValue,
		type FilterConfig,
		type RecentFilterConfig
	} from './filters'
	import type { TableUrl } from './tableUrl.svelte'
	import type { Facets } from './types'
	import type { FilterValue } from './urlState'

	interface Props {
		config: FilterConfig[]
		url: TableUrl
		facets?: Facets | undefined
	}

	const { config, url, facets }: Props = $props()

	const filters = $derived(url.state.filters)
	const activeCount = $derived(activeFilterCount(filters, config))

	function setFilters(next: Record<string, FilterValue>) {
		void url.update({ filters: next })
	}

	const formatCount = (label: string, count: number) =>
		m.data_table_filter_selected({ label, count })

	const ANY = 'any'
	const CUSTOM = 'custom'

	function recentOptions(filter: RecentFilterConfig, current: number | 'custom' | null) {
		const options: { value: string; label: string; disabled?: boolean }[] = [
			{ value: ANY, label: m.data_table_filter_any_time() },
			...filter.presets.map((preset) => ({
				value: String(preset.days),
				label: labelText(preset.label)
			}))
		]
		if (current === CUSTOM) {
			const value = filters[filter.key]
			const range = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
			options.push({
				value: CUSTOM,
				label: `${range.gte ?? ''}–${range.lte ?? ''}`,
				disabled: true
			})
		}
		return options
	}
</script>

<div class="filters" role="group" aria-label={m.filters_title()}>
	{#each config as filter (filter.kind === 'toggles' ? filter.id : filter.key)}
		{#if filter.kind === 'multi'}
			{@const selected = multiValue(filters, filter.key)}
			{@const options = resolveOptions(
				filter.options(),
				filter.facet ? facets?.[filter.key] : undefined,
				selected
			)}
			{@const label = labelText(filter.label)}
			<MultiSelect
				{options}
				value={selected}
				onValueChange={(values) => setFilters(applyMulti(filters, filter.key, values))}
				placeholder={label}
				displayText={multiTriggerText(label, options, selected, formatCount)}
				size="small"
			/>
		{:else if filter.kind === 'toggles'}
			{@const selected = toggleValue(filters, filter)}
			{@const options = filter.toggles.map((t) => ({ value: t.key, label: labelText(t.label) }))}
			{@const label = labelText(filter.label)}
			<MultiSelect
				{options}
				value={selected}
				onValueChange={(keys) => setFilters(applyToggles(filters, filter, keys))}
				placeholder={label}
				displayText={multiTriggerText(label, options, selected, formatCount)}
				size="small"
			/>
		{:else}
			{@const current = matchRecent(filters[filter.key], filter.presets)}
			<div class="recent">
				<Select
					options={recentOptions(filter, current)}
					value={current === null ? undefined : String(current)}
					onValueChange={(value) =>
						setFilters(
							applyRecent(
								filters,
								filter.key,
								value === undefined || value === ANY ? null : Number(value)
							)
						)}
					placeholder={labelText(filter.label)}
					ariaLabel={labelText(filter.label)}
					size="small"
				/>
			</div>
		{/if}
	{/each}

	{#if activeCount > 0}
		<Button variant="ghost" size="small" onclick={() => setFilters({})}>
			{m.data_table_filter_clear({ count: activeCount })}
		</Button>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: spacing.$unit;
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
	}

	.recent :global([data-select-trigger]) {
		min-width: 128px;
	}
</style>
