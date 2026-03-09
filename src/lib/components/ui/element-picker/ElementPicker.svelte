
<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity'
	import Select from '../Select.svelte'
	import MultiSelect from '../MultiSelect.svelte'
	import ElementPickerSegmented from './ElementPickerSegmented.svelte'
	import { ELEMENT_LABELS, getElementImage } from '$lib/utils/element'

	// Element display order: Fire(2) → Water(3) → Earth(4) → Wind(1) → Light(6) → Dark(5)
	const ELEMENT_DISPLAY_ORDER = [2, 3, 4, 1, 6, 5]

	interface Props {
		value?: number | number[]
		onValueChange?: (value: number | number[]) => void
		multiple?: boolean
		includeAny?: boolean
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
		includeAny = false,
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

	// Build element options for Select/MultiSelect
	const options = $derived.by(() => {
		const order = includeAny ? [0, ...ELEMENT_DISPLAY_ORDER] : ELEMENT_DISPLAY_ORDER
		return order.map((element) => ({
			value: element,
			label: element === 0 ? 'Any' : (ELEMENT_LABELS[element] ?? 'Unknown'),
			image: getElementImage(element)
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
			placeholder="Select elements..."
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
			placeholder="Select element"
			fullWidth={true}
			class={className}
		/>
	{/if}
{:else}
	<ElementPickerSegmented
		{value}
		onValueChange={handleSegmentedChange}
		{multiple}
		{includeAny}
		{contained}
		{showClear}
		size={segmentedSize}
		disabled={disabled}
		class={className}
	/>
{/if}
