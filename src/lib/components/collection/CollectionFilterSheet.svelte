<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import Button from '$lib/components/ui/Button.svelte'

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
		onClear: () => void
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	}

	let { open = $bindable(false), filters, onClear, element }: Props = $props()

	function handleDone() {
		open = false
	}
</script>

<BottomSheet bind:open title={m.filters_title()}>
	<div class="filter-sheet">
		{#each filters as filter (filter.key)}
			<div class="filter-group">
				<span class="filter-label">{filter.placeholder}</span>
				{#if filter.key === 'element'}
					<ElementPicker
						value={filter.value as number[]}
						onValueChange={(v) => filter.onChange(v as number[])}
						multiple
						mode="dropdown"
						size="medium"
						contained
					/>
				{:else}
					<MultiSelect
						options={filter.options}
						value={filter.value}
						onValueChange={filter.onChange}
						placeholder={filter.placeholder}
						size="medium"
						contained
					/>
				{/if}
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
