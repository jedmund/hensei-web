<!-- Segment Component -->
<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import styles from './segment.module.scss';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLButtonAttributes, 'value'> {
		value: string;
		class?: string;
	}

	let {
		value,
		class: className,
		children,
		...restProps
	}: Props = $props();
</script>

<RadioGroupPrimitive.Item
	{value}
	class={cn(styles.segment, className)}
	{...restProps}
>
	<RadioGroupPrimitive.ItemIndicator class={styles.indicator} />
	<span class={styles.label}>{children}</span>
</RadioGroupPrimitive.Item>