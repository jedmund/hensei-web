<!-- Checkbox Component -->
<svelte:options runes={true} />
<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from 'bits-ui';
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

	const sizeClass = $derived(size);
	const variantClass = $derived(variant === 'bound' ? 'bound' : '');
</script>

<CheckboxPrimitive.Root
	bind:checked
	{disabled}
	{required}
	{name}
	{value}
	class="checkbox {sizeClass} {variantClass} {className || ''}"
	{...restProps}
>
	<CheckboxPrimitive.Indicator class="indicator">
		{#if checked === 'indeterminate'}
			<span class="icon">−</span>
		{:else if checked}
			<span class="icon">✓</span>
		{/if}
	</CheckboxPrimitive.Indicator>
</CheckboxPrimitive.Root>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/effects' as *;

	.checkbox {
		background-color: var(--input-bg);
		border: 2px solid var(--separator-bg);
		border-radius: $item-corner-small;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		@include smooth-transition($duration-zoom, all);

		&:hover:not(:disabled) {
			background-color: var(--input-bg-hover);
			border-color: var(--separator-bg-hover);
		}

		&:focus,
		&:focus-visible {
			@include focus-ring($blue);
		}

		&[data-state='checked'],
		&[data-state='indeterminate'] {
			background-color: var(--accent-blue);
			border-color: var(--accent-blue);

			&:hover:not(:disabled) {
				background-color: var(--accent-blue-hover);
				border-color: var(--accent-blue-hover);
			}
		}

		&:disabled {
			cursor: not-allowed;
			opacity: 0.5;
		}

		&.bound {
			background-color: var(--input-bound-bg);

			&:hover:not(:disabled) {
				background-color: var(--input-bound-bg-hover);
			}

			&[data-state='checked'],
			&[data-state='indeterminate'] {
				background-color: var(--accent-blue);
				border-color: var(--accent-blue);
			}
		}
	}

	// Size variations
	.small {
		width: $unit-2x;
		height: $unit-2x;

		.icon {
			width: calc($unit * 1.5);
			height: calc($unit * 1.5);
		}
	}

	.medium {
		width: calc($unit * 2.5);
		height: calc($unit * 2.5);

		.icon {
			width: calc($unit * 1.75);
			height: calc($unit * 1.75);
		}
	}

	.large {
		width: $unit-3x;
		height: $unit-3x;

		.icon {
			width: calc($unit * 2.25);
			height: calc($unit * 2.25);
		}
	}

	.indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	.icon {
		stroke-width: 3;
	}
</style>