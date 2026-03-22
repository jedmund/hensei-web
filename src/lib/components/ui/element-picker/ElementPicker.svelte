
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { MediaQuery } from 'svelte/reactivity'
	import Select from '../Select.svelte'
	import MultiSelect from '../MultiSelect.svelte'
	import ElementPickerSegmented from './ElementPickerSegmented.svelte'
	import { ELEMENT_LABELS, ELEMENT_DISPLAY_ORDER, getElementImage, getElementKey } from '$lib/utils/element'

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

	// Accent color using themed CSS variable for the selected element
	const accentColor = $derived.by(() => {
		const selected = typeof value === 'number' ? value : Array.isArray(value) ? value[0] : undefined
		if (selected === undefined) return undefined
		const key = getElementKey(selected)
		return key !== 'null' ? `var(--${key}-text)` : undefined
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
	<!-- svelte-ignore css_unused_selector -->
	<div class="element-picker-dropdown" style:--accent-color={accentColor}>
		{#if multiple}
			<MultiSelect
				{options}
				value={Array.isArray(value) ? value : value !== undefined ? [value] : []}
				onValueChange={handleMultipleChange}
				size="medium"
				{contained}
				disabled={disabled}
				placeholder={m.placeholder_select_elements()}
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
				placeholder={m.placeholder_select_element()}
				fullWidth={true}
				class={className}
			/>
		{/if}
	</div>
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

<style>
	.element-picker-dropdown {
		display: contents;
	}
</style>
