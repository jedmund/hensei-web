<svelte:options runes={true} />

<script lang="ts">
	import { ToggleGroup } from 'bits-ui'
	import Tooltip from '../Tooltip.svelte'
	import { ELEMENT_LABELS, getElementImage } from '$lib/utils/element'
	import styles from './element-picker.module.scss'

	// Element display order: Fire(2) → Water(3) → Earth(4) → Wind(1) → Light(6) → Dark(5)
	const ELEMENT_DISPLAY_ORDER = [2, 3, 4, 1, 6, 5]

	interface Props {
		value?: number | number[]
		onValueChange?: (value: number | number[]) => void
		multiple?: boolean
		includeAny?: boolean
		contained?: boolean
		disabled?: boolean
		class?: string
	}

	let {
		value = $bindable(),
		onValueChange,
		multiple = false,
		includeAny = false,
		contained = false,
		disabled = false,
		class: className = ''
	}: Props = $props()

	// Build element list based on includeAny prop
	const elements = $derived(includeAny ? [0, ...ELEMENT_DISPLAY_ORDER] : ELEMENT_DISPLAY_ORDER)

	// Get label for element (use "Any" for element 0 instead of "Null")
	function getLabel(element: number): string {
		if (element === 0) return 'Any'
		return ELEMENT_LABELS[element] ?? 'Unknown'
	}

	// Convert value to string format for ToggleGroup
	const stringValue = $derived.by(() => {
		if (multiple) {
			const arr = Array.isArray(value) ? value : value !== undefined ? [value] : []
			return arr.map(String)
		} else {
			return value !== undefined ? String(value) : undefined
		}
	})

	// Handle value changes from ToggleGroup
	function handleSingleChange(newValue: string | undefined) {
		if (newValue !== undefined) {
			const numValue = Number(newValue)
			value = numValue
			onValueChange?.(numValue)
		}
	}

	function handleMultipleChange(newValue: string[]) {
		const numValues = newValue.map(Number)
		value = numValues
		onValueChange?.(numValues)
	}

	const containerClasses = $derived(
		[styles.container, contained && styles.contained, className].filter(Boolean).join(' ')
	)
</script>

<div class={containerClasses}>
	{#if multiple}
		<ToggleGroup.Root
			type="multiple"
			value={stringValue as string[]}
			onValueChange={handleMultipleChange}
			class={styles.group}
			{disabled}
		>
			{#each elements as element}
				<Tooltip content={getLabel(element)}>
					{#snippet children()}
						<ToggleGroup.Item value={String(element)} class={styles.item} {disabled}>
							<img
								src={getElementImage(element)}
								alt={getLabel(element)}
								class={styles.image}
							/>
						</ToggleGroup.Item>
					{/snippet}
				</Tooltip>
			{/each}
		</ToggleGroup.Root>
	{:else}
		<ToggleGroup.Root
			type="single"
			value={stringValue as string | undefined}
			onValueChange={handleSingleChange}
			class={styles.group}
			{disabled}
		>
			{#each elements as element}
				<Tooltip content={getLabel(element)}>
					{#snippet children()}
						<ToggleGroup.Item value={String(element)} class={styles.item} {disabled}>
							<img
								src={getElementImage(element)}
								alt={getLabel(element)}
								class={styles.image}
							/>
						</ToggleGroup.Item>
					{/snippet}
				</Tooltip>
			{/each}
		</ToggleGroup.Root>
	{/if}
</div>
