<!-- RepSegment Component - A segment with visual content and label -->
<svelte:options runes={true} />

<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui'
	import styles from './rep-segment.module.scss'
	import type { HTMLButtonAttributes } from 'svelte/elements'

	interface Props extends Omit<HTMLButtonAttributes, 'value'> {
		value: string
		label: string
		class?: string
		selected?: boolean
	}

	let {
		value,
		label,
		class: className,
		selected = false,
		children: content,
		...restProps
	}: Props = $props()
</script>

<RadioGroupPrimitive.Item
	{value}
	class={`${styles.repSegment} ${selected ? styles.selected : ''} ${className || ''}`}
	{...restProps}
>
	{#snippet children({ checked })}
		{#if checked}
			<div class={styles.indicator}></div>
		{/if}
		<div class={styles.wrapper}>
			<div class={styles.content}>
				{@render content?.()}
			</div>
			<div class={styles.label}>{label}</div>
		</div>
	{/snippet}
</RadioGroupPrimitive.Item>
