<!-- RepSegment Component - A segment with visual content and label -->

<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui'
	import type { Snippet } from 'svelte'
	import styles from './rep-segment.module.scss'

	interface Props {
		value: string
		label: string
		labelIcon?: string
		class?: string
		selected?: boolean
		disabled?: boolean
		children?: Snippet
	}

	let {
		value,
		label,
		labelIcon,
		class: className,
		selected = false,
		disabled,
		children: content
	}: Props = $props()
</script>

<RadioGroupPrimitive.Item
	{value}
	{...(disabled !== undefined ? { disabled } : {})}
	class={`${styles.repSegment} ${selected ? styles.selected : ''} ${className || ''}`}
>
	{#snippet children({ checked })}
		{#if checked}
			<div class={styles.indicator}></div>
		{/if}
		<div class={styles.wrapper}>
			<div class={styles.content}>
				{@render content?.()}
			</div>
			<div class={styles.label}>
				{#if labelIcon}
					<img src={labelIcon} alt="" class={styles.labelIcon} />
				{/if}
				{label}
			</div>
		</div>
	{/snippet}
</RadioGroupPrimitive.Item>
