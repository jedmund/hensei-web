
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { MediaQuery } from 'svelte/reactivity'
	import Select from '../Select.svelte'
	import MultiSelect from '../MultiSelect.svelte'
	import RarityPickerSegmented from './RarityPickerSegmented.svelte'
	import { RARITY_LABELS, getRarityImage } from '$lib/utils/rarity'

	// Rarity display order: R(1) → SR(2) → SSR(3)
	const RARITY_DISPLAY_ORDER = [1, 2, 3]

	interface Props {
		value?: number | number[]
		onValueChange?: (value: number | number[]) => void
		multiple?: boolean
		mode?: 'auto' | 'segmented' | 'dropdown'
		contained?: boolean
		size?: 'small' | 'medium' | 'large'
		showClear?: boolean
		disabled?: boolean
		class?: string
	}

	let {
		value = $bindable(),
		onValueChange,
		multiple = false,
		mode = 'auto',
		contained = false,
		size = 'medium',
		showClear = false,
		disabled = false,
		class: className = ''
	}: Props = $props()

	// Map size to segmented control size (small stays small, medium/large become regular)
	const segmentedSize = $derived(size === 'small' ? 'small' : 'regular')

	// Responsive detection for auto mode
	const isMobile = new MediaQuery('(max-width: 640px)')

	// Determine if we should use dropdown mode
	const shouldUseDropdown = $derived(mode === 'dropdown' || (mode === 'auto' && isMobile.current))

	// Build rarity options for Select/MultiSelect
	const options = $derived.by(() => {
		return RARITY_DISPLAY_ORDER.map((rarity) => ({
			value: rarity,
			label: RARITY_LABELS[rarity] ?? 'Unknown',
			image: getRarityImage(rarity)
		}))
	})

	// Handle value changes for single-select dropdown
	function handleSingleChange(newValue: number | undefined) {
		if (newValue !== undefined) {
			value = newValue
			onValueChange?.(newValue)
		}
	}

	// Handle value changes for multi-select dropdown
	function handleMultipleChange(newValue: number[]) {
		value = newValue
		onValueChange?.(newValue)
	}

	// Handle value changes for segmented control
	function handleSegmentedChange(newValue: number | number[]) {
		value = newValue
		onValueChange?.(newValue)
	}
</script>

{#if shouldUseDropdown}
	{#if multiple}
		<MultiSelect
			{options}
			value={Array.isArray(value) ? value : value !== undefined ? [value] : []}
			onValueChange={handleMultipleChange}
			size="medium"
			{contained}
			disabled={disabled}
			placeholder={m.placeholder_select_rarities()}
			fullWidth={true}
			class={className}
		/>
	{:else}
		<Select
			{options}
			value={typeof value === 'number' ? value : undefined}
			onValueChange={handleSingleChange}
			size="medium"
			{contained}
			disabled={disabled}
			placeholder={m.filter_rarity()}
			fullWidth={true}
			class={className}
		/>
	{/if}
{:else}
	<RarityPickerSegmented
		{value}
		onValueChange={handleSegmentedChange}
		{multiple}
		{contained}
		{showClear}
		size={segmentedSize}
		disabled={disabled}
		class={className}
	/>
{/if}
