<!-- Checkbox Component -->

<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from 'bits-ui'
	import CheckIcon from '$src/assets/icons/check.svg?raw'

	interface Props {
		checked?: boolean
		indeterminate?: boolean
		disabled?: boolean
		required?: boolean
		name?: string
		value?: string
		onCheckedChange?: (checked: boolean) => void
		class?: string
		variant?: 'default' | 'bound'
		/** Contained background style (alias for variant='bound') */
		contained?: boolean
		size?: 'small' | 'medium' | 'large'
		/** Full width checkbox container */
		fullWidth?: boolean
		/** Element color theme for checked state */
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	}

	let {
		checked = $bindable(false),
		indeterminate = false,
		disabled = false,
		required = false,
		name,
		value,
		onCheckedChange,
		class: className,
		variant = 'default',
		contained = false,
		size = 'medium',
		fullWidth = false,
		element
	}: Props = $props()

	const sizeClass = $derived(size)
	// contained prop is an alias for variant='bound'
	const variantClass = $derived(variant === 'bound' || contained ? 'bound' : '')
	const fullWidthClass = $derived(fullWidth ? 'full' : '')
</script>

<CheckboxPrimitive.Root
	bind:checked
	{indeterminate}
	{disabled}
	{required}
	{onCheckedChange}
	name={name ?? ''}
	value={value ?? ''}
	class="checkbox {sizeClass} {variantClass} {fullWidthClass} {element || ''} {className || ''}"
>
	{#snippet children({ checked: isChecked, indeterminate: isIndeterminate })}
		<span class="indicator">
			{#if isIndeterminate}
				<span class="icon indeterminate"></span>
			{:else if isChecked}
				<span class="icon">{@html CheckIcon}</span>
			{/if}
		</span>
	{/snippet}
</CheckboxPrimitive.Root>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/effects' as *;

	// Base checkbox styles
	:global(.checkbox) {
		// Default (no element) colors - light grey bg with dark grey check
		--cb-checked-bg: var(--null-bg);
		--cb-checked-bg-hover: var(--null-bg-hover);
		--cb-checked-fg: var(--checkbox-checked-fg);

		background-color: var(--checkbox-bg);
		border: none;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		@include smooth-transition($duration-zoom, all);
	}

	:global(.checkbox:hover:not(:disabled)) {
		background-color: var(--checkbox-bg-hover);
	}

	:global(.checkbox:focus),
	:global(.checkbox:focus-visible) {
		@include focus-ring($blue);
	}

	:global(.checkbox[data-state='checked']),
	:global(.checkbox[data-state='indeterminate']) {
		background-color: var(--cb-checked-bg);
	}

	:global(.checkbox[data-state='checked']:hover:not(:disabled)),
	:global(.checkbox[data-state='indeterminate']:hover:not(:disabled)) {
		background-color: var(--cb-checked-bg-hover);
	}

	:global(.checkbox:disabled) {
		cursor: not-allowed;
		opacity: 0.5;
	}

	:global(.checkbox.bound) {
		background-color: var(--checkbox-bound-bg);
	}

	:global(.checkbox.bound:hover:not(:disabled)) {
		background-color: var(--checkbox-bound-bg-hover);
	}

	// Element-specific color overrides
	:global(.checkbox.wind) {
		--cb-checked-bg: var(--wind-button-bg);
		--cb-checked-bg-hover: var(--wind-button-bg-hover);
		--cb-checked-fg: white;
	}

	:global(.checkbox.fire) {
		--cb-checked-bg: var(--fire-button-bg);
		--cb-checked-bg-hover: var(--fire-button-bg-hover);
		--cb-checked-fg: white;
	}

	:global(.checkbox.water) {
		--cb-checked-bg: var(--water-button-bg);
		--cb-checked-bg-hover: var(--water-button-bg-hover);
		--cb-checked-fg: white;
	}

	:global(.checkbox.earth) {
		--cb-checked-bg: var(--earth-button-bg);
		--cb-checked-bg-hover: var(--earth-button-bg-hover);
		--cb-checked-fg: white;
	}

	:global(.checkbox.dark) {
		--cb-checked-bg: var(--dark-button-bg);
		--cb-checked-bg-hover: var(--dark-button-bg-hover);
		--cb-checked-fg: white;
	}

	:global(.checkbox.light) {
		--cb-checked-bg: var(--light-button-bg);
		--cb-checked-bg-hover: var(--light-button-bg-hover);
		--cb-checked-fg: white;
	}

	// Element colors when bound (higher specificity to override .checkbox.bound)
	:global(.checkbox.bound.wind[data-state='checked']),
	:global(.checkbox.bound.wind[data-state='indeterminate']),
	:global(.checkbox.bound.fire[data-state='checked']),
	:global(.checkbox.bound.fire[data-state='indeterminate']),
	:global(.checkbox.bound.water[data-state='checked']),
	:global(.checkbox.bound.water[data-state='indeterminate']),
	:global(.checkbox.bound.earth[data-state='checked']),
	:global(.checkbox.bound.earth[data-state='indeterminate']),
	:global(.checkbox.bound.dark[data-state='checked']),
	:global(.checkbox.bound.dark[data-state='indeterminate']),
	:global(.checkbox.bound.light[data-state='checked']),
	:global(.checkbox.bound.light[data-state='indeterminate']) {
		background-color: var(--cb-checked-bg);
	}

	:global(.checkbox.bound.wind[data-state='checked']:hover:not(:disabled)),
	:global(.checkbox.bound.wind[data-state='indeterminate']:hover:not(:disabled)),
	:global(.checkbox.bound.fire[data-state='checked']:hover:not(:disabled)),
	:global(.checkbox.bound.fire[data-state='indeterminate']:hover:not(:disabled)),
	:global(.checkbox.bound.water[data-state='checked']:hover:not(:disabled)),
	:global(.checkbox.bound.water[data-state='indeterminate']:hover:not(:disabled)),
	:global(.checkbox.bound.earth[data-state='checked']:hover:not(:disabled)),
	:global(.checkbox.bound.earth[data-state='indeterminate']:hover:not(:disabled)),
	:global(.checkbox.bound.dark[data-state='checked']:hover:not(:disabled)),
	:global(.checkbox.bound.dark[data-state='indeterminate']:hover:not(:disabled)),
	:global(.checkbox.bound.light[data-state='checked']:hover:not(:disabled)),
	:global(.checkbox.bound.light[data-state='indeterminate']:hover:not(:disabled)) {
		background-color: var(--cb-checked-bg-hover);
	}

	// Size variations
	:global(.checkbox.small) {
		--cb-icon-size: #{calc($unit * 1.5)};
		--cb-dash-height: 3px;
		border-radius: $item-corner;
		width: $unit-3x;
		height: $unit-3x;
	}

	:global(.checkbox.medium) {
		--cb-icon-size: #{$unit-2x};
		--cb-dash-height: 4px;
		border-radius: $card-corner;
		width: $unit-4x;
		height: $unit-4x;
	}

	:global(.checkbox.large) {
		--cb-icon-size: #{calc($unit * 2.5)};
		--cb-dash-height: 4px;
		border-radius: $card-corner;
		width: $unit-5x;
		height: $unit-5x;
	}

	// Indicator and icon styles
	:global(.checkbox .indicator) {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--cb-checked-fg);
	}

	:global(.checkbox .icon) {
		display: flex;
		align-items: center;
		justify-content: center;

		:global(svg) {
			width: var(--cb-icon-size);
			height: var(--cb-icon-size);
			fill: currentColor;
		}

		&.indeterminate {
			width: var(--cb-icon-size);
			height: var(--cb-dash-height);
			background-color: var(--cb-checked-fg);
			border-radius: $unit-fourth;
		}
	}
</style>
