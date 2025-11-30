<!-- Switch Component -->
<svelte:options runes={true} />
<script lang="ts">
	import { Switch as SwitchPrimitive } from 'bits-ui';

	interface Props {
		checked?: boolean;
		disabled?: boolean;
		required?: boolean;
		name?: string;
		value?: string;
		/** Switch size */
		size?: 'small' | 'medium' | 'large';
		/** Full width switch */
		fullWidth?: boolean;
		/** Element color theme for checked state */
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined;
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
		size = 'medium',
		fullWidth = false,
		element,
		onCheckedChange,
		class: className,
		thumbClass
	}: Props = $props();

	$effect(() => {
		if (onCheckedChange && checked !== undefined) {
			onCheckedChange(checked);
		}
	});

	const switchClass = $derived(
		['switch', size, fullWidth && 'full', element, className].filter(Boolean).join(' ')
	);
</script>

<SwitchPrimitive.Root
	bind:checked
	{disabled}
	{required}
	{...(name !== undefined ? { name } : {})}
	{...(value !== undefined ? { value } : {})}
	class={switchClass}
>
	<SwitchPrimitive.Thumb class="thumb {thumbClass || ''}" />
</SwitchPrimitive.Root>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	// Base switch styles - wrapped in :global() for Bits UI
	:global([data-switch-root].switch) {
		// Default (no element) colors
		--sw-checked-bg: var(--null-button-bg);
		--sw-checked-bg-hover: var(--null-button-bg-hover);

		background: $grey-70;
		border: 2px solid transparent;
		box-sizing: border-box;
		position: relative;
		cursor: pointer;
		@include smooth-transition($duration-instant, background-color);
	}

	:global([data-switch-root].switch:focus),
	:global([data-switch-root].switch:focus-visible) {
		@include focus-ring($blue);
	}

	:global([data-switch-root].switch:hover:not(:disabled)) {
		background: $grey-75;
	}

	:global([data-switch-root].switch[data-state='checked']) {
		background: var(--sw-checked-bg);
	}

	:global([data-switch-root].switch[data-state='checked']:hover:not(:disabled)) {
		background: var(--sw-checked-bg-hover);
	}

	:global([data-switch-root].switch:disabled) {
		box-shadow: none;
		cursor: not-allowed;
		opacity: 0.5;
	}

	:global([data-switch-root].switch.full) {
		width: 100%;
	}

	// Element-specific color overrides
	:global([data-switch-root].switch.wind) {
		--sw-checked-bg: var(--wind-button-bg);
		--sw-checked-bg-hover: var(--wind-button-bg-hover);
	}

	:global([data-switch-root].switch.fire) {
		--sw-checked-bg: var(--fire-button-bg);
		--sw-checked-bg-hover: var(--fire-button-bg-hover);
	}

	:global([data-switch-root].switch.water) {
		--sw-checked-bg: var(--water-button-bg);
		--sw-checked-bg-hover: var(--water-button-bg-hover);
	}

	:global([data-switch-root].switch.earth) {
		--sw-checked-bg: var(--earth-button-bg);
		--sw-checked-bg-hover: var(--earth-button-bg-hover);
	}

	:global([data-switch-root].switch.dark) {
		--sw-checked-bg: var(--dark-button-bg);
		--sw-checked-bg-hover: var(--dark-button-bg-hover);
	}

	:global([data-switch-root].switch.light) {
		--sw-checked-bg: var(--light-button-bg);
		--sw-checked-bg-hover: var(--light-button-bg-hover);
	}

	:global([data-switch-root].switch:disabled .thumb) {
		background: $grey-80;
		cursor: not-allowed;
	}

	// Size: Small
	:global([data-switch-root].switch.small) {
		$height: $unit-3x; // 24px
		border-radius: calc($height / 2);
		padding-left: $unit-fourth;
		padding-right: $unit-fourth;
		width: calc($unit-5x + $unit-half); // 44px
		height: $height;
	}

	:global([data-switch-root].switch.small .thumb) {
		height: calc($unit-2x + $unit-half); // 20px
		width: calc($unit-2x + $unit-half); // 20px
		border-radius: calc(($unit-2x + $unit-half) / 2);
	}

	:global([data-switch-root].switch.small .thumb[data-state='checked']) {
		transform: translateX(calc($unit-2x + $unit-half)); // 20px
	}

	// Size: Medium (default)
	:global([data-switch-root].switch.medium) {
		$height: calc($unit-4x + $unit-fourth); // 34px
		border-radius: calc($height / 2);
		padding-left: $unit-half;
		padding-right: $unit-half;
		width: $unit-7x + $unit-fourth; // 58px
		height: $height;
	}

	:global([data-switch-root].switch.medium .thumb) {
		height: $unit-3x + $unit-fourth; // 26px
		width: $unit-3x + $unit-fourth; // 26px
		border-radius: calc(($unit-3x + $unit-fourth) / 2);
	}

	:global([data-switch-root].switch.medium .thumb[data-state='checked']) {
		transform: translateX(21px);
	}

	// Size: Large
	:global([data-switch-root].switch.large) {
		$height: $unit-5x; // 40px
		border-radius: calc($height / 2);
		padding-left: $unit-half;
		padding-right: $unit-half;
		width: calc($unit-8x + $unit); // 72px
		height: $height;
	}

	:global([data-switch-root].switch.large .thumb) {
		height: calc($unit-4x); // 32px
		width: calc($unit-4x); // 32px
		border-radius: $unit-2x;
	}

	:global([data-switch-root].switch.large .thumb[data-state='checked']) {
		transform: translateX(calc($unit-4x)); // 32px
	}

	// Thumb base styles
	:global([data-switch-root] .thumb) {
		background: $grey-100;
		display: block;
		@include smooth-transition($duration-instant, transform);
		transform: translateX(-1px);
		cursor: pointer;
	}

	:global([data-switch-root] .thumb[data-state='checked']) {
		background: $grey-100;
	}
</style>
