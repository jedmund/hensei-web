
<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity'
	import Select from '../Select.svelte'
	import MultiSelect from '../MultiSelect.svelte'
	import ProficiencyPickerSegmented from './ProficiencyPickerSegmented.svelte'
	import { PROFICIENCY_LABELS, getProficiencyImage } from '$lib/utils/proficiency'

	// Proficiency display order for dropdown: Sabre, Dagger, Spear, Axe, Staff, Gun, Melee, Bow, Harp, Katana
	const PROFICIENCY_DISPLAY_ORDER = [1, 2, 4, 3, 6, 9, 7, 5, 8, 10]

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

	// Build proficiency options for Select/MultiSelect
	const options = $derived.by(() => {
		return PROFICIENCY_DISPLAY_ORDER.map((proficiency) => ({
			value: proficiency,
			label: PROFICIENCY_LABELS[proficiency] ?? 'Unknown',
			image: getProficiencyImage(proficiency)
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
			placeholder="Select proficiencies..."
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
			placeholder="Select proficiency"
			fullWidth={true}
			class={className}
		/>
	{/if}
{:else}
	<ProficiencyPickerSegmented
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
