<!-- Checkbox Component -->
<svelte:options runes={true} />
<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from 'bits-ui';
	import { Check, Minus } from 'lucide-svelte';
	import styles from './checkbox.module.scss';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLButtonAttributes, 'value'> {
		checked?: boolean | 'indeterminate';
		disabled?: boolean;
		required?: boolean;
		name?: string;
		value?: string;
		onCheckedChange?: (checked: boolean | 'indeterminate') => void;
		class?: string;
		variant?: 'default' | 'bound';
		size?: 'small' | 'medium' | 'large';
	}

	let {
		checked = $bindable(false),
		disabled = false,
		required = false,
		name,
		value,
		onCheckedChange,
		class: className,
		variant = 'default',
		size = 'medium',
		...restProps
	}: Props = $props();

	$effect(() => {
		if (onCheckedChange && checked !== undefined) {
			onCheckedChange(checked);
		}
	});

	const sizeClasses = {
		small: styles.small,
		medium: styles.medium,
		large: styles.large
	};

	const variantClasses = {
		default: '',
		bound: styles.bound
	};
</script>

<CheckboxPrimitive.Root
	bind:checked
	{disabled}
	{required}
	{name}
	{value}
	class={`${styles.checkbox} ${sizeClasses[size]} ${variantClasses[variant]} ${className || ''}`}
	{...restProps}
>
	<CheckboxPrimitive.Indicator class={styles.indicator}>
		{#if checked === 'indeterminate'}
			<Minus class={styles.icon} />
		{:else}
			<Check class={styles.icon} />
		{/if}
	</CheckboxPrimitive.Indicator>
</CheckboxPrimitive.Root>