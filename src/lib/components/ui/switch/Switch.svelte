<!-- Switch Component -->
<svelte:options runes={true} />
<script lang="ts">
	import { Switch as SwitchPrimitive } from 'bits-ui';
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
	class="switch {className || ''}"
	{...restProps}
>
	<SwitchPrimitive.Thumb class="thumb {thumbClass || ''}" />
</SwitchPrimitive.Root>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	.switch {
		$height: calc($unit-4x + $unit-fourth);  // 34px
		background: $grey-70;
		border-radius: calc($height / 2);
		border: none;
		padding-left: $unit-half;
		padding-right: $unit-half;
		position: relative;
		width: $unit-7x + $unit-fourth; // 58px
		height: $height;
		cursor: pointer;
		@include smooth-transition($duration-instant, background-color);

		&:focus,
		&:focus-visible {
			@include focus-ring($blue);
		}

		&[data-state='checked'] {
			background: var(--accent-blue);
		}

		&:disabled {
			box-shadow: none;
			cursor: not-allowed;
			opacity: 0.5;

			.thumb {
				background: $grey-80;
				cursor: not-allowed;
			}
		}
	}

	.thumb {
		background: $grey-100;
		border-radius: calc($unit-3x + $unit-fourth / 2); // 13px
		display: block;
		height: $unit-3x + $unit-fourth; // 26px
		width: $unit-3x + $unit-fourth; // 26px
		@include smooth-transition($duration-instant, transform);
		transform: translateX(0px);
		cursor: pointer;

		&[data-state='checked'] {
			background: $grey-100;
			transform: translateX($unit-3x); // 24px
		}
	}
</style>