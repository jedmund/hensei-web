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
		border: none;
		box-sizing: border-box;
		position: relative;
		cursor: pointer;
		display: flex;
		align-items: center;
		@include smooth-transition($duration-instant, background-color);
	}

	:global([data-switch-root].switch:focus),
	:global([data-switch-root].switch:focus-visible) {
		outline: none;
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

	// Size: Small (22px track height, 16px thumb)
	:global([data-switch-root].switch.small) {
		$track-height: 22px;
		$thumb-size: 16px;
		$track-padding: 3px;
		$track-width: 40px;

		border-radius: calc($track-height / 2);
		padding: 0 $track-padding;
		width: $track-width;
		height: $track-height;
	}

	:global([data-switch-root].switch.small .thumb) {
		$thumb-size: 16px;
		height: $thumb-size;
		width: $thumb-size;
		border-radius: 50%;
	}

	:global([data-switch-root].switch.small .thumb[data-state='checked']) {
		// Move distance: track-width - thumb-size - (2 * padding)
		transform: translateX(18px);
	}

	// Size: Medium (default) (26px track height, 20px thumb)
	:global([data-switch-root].switch.medium) {
		$track-height: 26px;
		$thumb-size: 20px;
		$track-padding: 3px;
		$track-width: 48px;

		border-radius: calc($track-height / 2);
		padding: 0 $track-padding;
		width: $track-width;
		height: $track-height;
	}

	:global([data-switch-root].switch.medium .thumb) {
		$thumb-size: 20px;
		height: $thumb-size;
		width: $thumb-size;
		border-radius: 50%;
	}

	:global([data-switch-root].switch.medium .thumb[data-state='checked']) {
		// Move distance: track-width - thumb-size - (2 * padding)
		transform: translateX(22px);
	}

	// Size: Large (30px track height, 24px thumb)
	:global([data-switch-root].switch.large) {
		$track-height: 30px;
		$thumb-size: 24px;
		$track-padding: 3px;
		$track-width: 56px;

		border-radius: calc($track-height / 2);
		padding: 0 $track-padding;
		width: $track-width;
		height: $track-height;
	}

	:global([data-switch-root].switch.large .thumb) {
		$thumb-size: 24px;
		height: $thumb-size;
		width: $thumb-size;
		border-radius: 50%;
	}

	:global([data-switch-root].switch.large .thumb[data-state='checked']) {
		// Move distance: track-width - thumb-size - (2 * padding)
		transform: translateX(26px);
	}

	// Thumb base styles
	:global([data-switch-root] .thumb) {
		background: white;
		display: block;
		flex-shrink: 0;
		@include smooth-transition($duration-instant, transform);
		transform: translateX(0);
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	:global([data-switch-root] .thumb[data-state='checked']) {
		background: white;
	}
</style>
