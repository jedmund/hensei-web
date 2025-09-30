<!-- Segment Component -->
<svelte:options runes={true} />

<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui'
	import { getContext } from 'svelte'
	import styles from './segment.module.scss'
	import type { HTMLButtonAttributes } from 'svelte/elements'
	import type { SegmentedControlVariant } from './SegmentedControl.svelte'

	interface Props extends Omit<HTMLButtonAttributes, 'value'> {
		value: string
		class?: string
	}

	let { value, class: className, children: content, ...restProps }: Props = $props()

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

<RadioGroupPrimitive.Item {value} class={segmentClass} {...restProps}>
	{#snippet children({ checked })}
		{#if checked}
			<div class={styles.indicator}></div>
		{/if}
		<span class={styles.label}>{@render content?.()}</span>
	{/snippet}
</RadioGroupPrimitive.Item>