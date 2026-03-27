<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import type { CollectionSortKey } from '$lib/types/api/collection'

	interface FilterConfig {
		key: string
		options: { value: number | string; label: string; color?: string }[]
		value: (number | string)[]
		onChange: (value: (number | string)[]) => void
		placeholder: string
	}

	interface Props {
		open: boolean
		filters: FilterConfig[]
		sortOptions: { value: string; label: string }[]
		sortBy: CollectionSortKey
		onSortChange: (value: CollectionSortKey) => void
		onClear: () => void
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	}

	let {
		open = $bindable(false),
		filters,
		sortOptions,
		sortBy,
		onSortChange,
		onClear,
		element
	}: Props = $props()

	function handleSortChange(value: string | undefined) {
		if (value) onSortChange(value as CollectionSortKey)
	}

	function handleDone() {
		open = false
	}
</script>

<BottomSheet bind:open title={m.filter_more()}>
	<div class="filter-sheet">
		<div class="filter-group">
			<span class="filter-label">{m.sort_label()}</span>
			<Select
				options={sortOptions}
				value={sortBy}
				onValueChange={handleSortChange}
				size="small"
				contained
			/>
		</div>

		{#each filters as filter (filter.key)}
			<div class="filter-group">
				<span class="filter-label">{filter.placeholder}</span>
				<MultiSelect
					options={filter.options}
					value={filter.value}
					onValueChange={filter.onChange}
					placeholder={filter.placeholder}
					size="small"
				/>
			</div>
		{/each}

		<div class="sheet-actions">
			<Button variant="ghost" size="small" onclick={onClear}>
				{m.filter_clear()}
			</Button>
			<Button
				variant="primary"
				size="small"
				{element}
				elementStyle={!!element}
				onclick={handleDone}
			>
				Done
			</Button>
		</div>
	</div>
</BottomSheet>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.filter-sheet {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
	}

	.filter-label {
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-secondary);
	}

	.sheet-actions {
		display: flex;
		justify-content: flex-end;
		gap: $unit;
		padding-top: $unit;
	}
</style>
