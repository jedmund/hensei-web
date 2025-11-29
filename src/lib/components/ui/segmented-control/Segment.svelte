<!-- Segment Component -->
<svelte:options runes={true} />

<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui'
	import { getContext } from 'svelte'
	import type { Snippet } from 'svelte'
	import styles from './segment.module.scss'
	import type { SegmentedControlVariant } from './SegmentedControl.svelte'

	interface Props {
		value: string
		class?: string
		disabled?: boolean
		children?: Snippet
	}

	let { value, class: className, disabled, children: content }: Props = $props()

	// Get variant from parent context
	const variant = getContext<SegmentedControlVariant>('segmented-control-variant') || 'default'

	// Apply variant-specific classes
	const variantClasses = {
		default: styles.default,
		blended: styles.blended,
		background: styles.background
	}

	const segmentClass = $derived(
		[
			styles.segment,
			variantClasses[variant],
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