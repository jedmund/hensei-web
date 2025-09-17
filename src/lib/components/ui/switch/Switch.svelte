<!-- Switch Component -->
<svelte:options runes={true} />
<script lang="ts">
	import { Switch as SwitchPrimitive } from 'bits-ui';
	import styles from './switch.module.scss';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLButtonAttributes, 'value'> {
		checked?: boolean;
		disabled?: boolean;
		required?: boolean;
		name?: string;
		value?: string;
		onCheckedChange?: (checked: boolean) => void;
		class?: string;
		thumbClass?: string;
	}

	let {
		checked = $bindable(false),
		disabled = false,
		required = false,
		name,
		value,
		onCheckedChange,
		class: className,
		thumbClass,
		...restProps
	}: Props = $props();

	$effect(() => {
		if (onCheckedChange && checked !== undefined) {
			onCheckedChange(checked);
		}
	});
</script>

<SwitchPrimitive.Root
	bind:checked
	{disabled}
	{required}
	{name}
	{value}
	class={`${styles.switch} ${className || ''}`}
	{...restProps}
>
	<SwitchPrimitive.Thumb class={`${styles.thumb} ${thumbClass || ''}`} />
</SwitchPrimitive.Root>