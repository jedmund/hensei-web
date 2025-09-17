<!-- Segment Component -->
<svelte:options runes={true} />
<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui';
	import styles from './segment.module.scss';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLButtonAttributes, 'value'> {
		value: string;
		class?: string;
	}

	let {
		value,
		class: className,
		children: content,
		...restProps
	}: Props = $props();
</script>

<RadioGroupPrimitive.Item
	{value}
	class={`${styles.segment} ${className || ''}`}
	{...restProps}
>
	{#snippet children({ checked })}
		{#if checked}
			<div class={styles.indicator}></div>
		{/if}
		<span class={styles.label}>{@render content?.()}</span>
	{/snippet}
</RadioGroupPrimitive.Item>