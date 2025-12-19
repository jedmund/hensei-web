<!-- Segment Component -->
<svelte:options runes={true} />

<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui'
	import { getContext } from 'svelte'
	import type { Snippet } from 'svelte'
	import styles from './segment.module.scss'
	import type { SegmentedControlVariant, SegmentedControlSize } from './SegmentedControl.svelte'

	interface Props {
		value: string
		class?: string
		disabled?: boolean
		children?: Snippet
	}

	let { value, class: className, disabled, children: content }: Props = $props()

	// Get variant, size, grow, and element from parent context
	const variant = getContext<SegmentedControlVariant>('segmented-control-variant') || 'default'
	const size = getContext<SegmentedControlSize>('segmented-control-size') || 'default'
	const grow = getContext<boolean>('segmented-control-grow') || false
	const element = getContext<'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | null>(
		'segmented-control-element'
	)

	// Apply variant-specific classes
	const variantClasses = {
		default: styles.default,
		blended: styles.blended,
		background: styles.background
	}

	// Apply size-specific classes
	const sizeClasses = {
		default: '',
		small: styles.small
	}

	// Apply element-specific classes
	const elementClasses: Record<string, string | undefined> = {
		wind: styles.wind,
		fire: styles.fire,
		water: styles.water,
		earth: styles.earth,
		dark: styles.dark,
		light: styles.light
	}

	const segmentClass = $derived(
		[
			styles.segment,
			variantClasses[variant],
			sizeClasses[size],
			element ? elementClasses[element] : '',
			grow ? styles.grow : '',
			className || ''
		]
			.filter(Boolean)
			.join(' ')
	)
</script>

<RadioGroupPrimitive.Item
	{value}
	{...(disabled !== undefined ? { disabled } : {})}
	class={segmentClass}
>
	{#snippet children({ checked })}
		{#if checked}
			<div class={styles.indicator}></div>
		{/if}
		<span class={styles.label}>{@render content?.()}</span>
	{/snippet}
</RadioGroupPrimitive.Item>