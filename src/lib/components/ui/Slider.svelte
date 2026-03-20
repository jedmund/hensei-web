
<script lang="ts">
	import { Slider as SliderPrimitive } from 'bits-ui'

	interface Props {
		/** Current value */
		value?: number
		/** Callback when value changes */
		onValueChange?: (value: number) => void
		/** Minimum value */
		min?: number
		/** Maximum value */
		max?: number
		/** Step increment */
		step?: number
		/** Whether the slider is disabled */
		disabled?: boolean
		/** Element color theme */
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
		/** Additional CSS classes */
		class?: string
	}

	const {
		value = 0,
		onValueChange,
		min = 0,
		max = 100,
		step = 1,
		disabled = false,
		element,
		class: className = ''
	}: Props = $props()
</script>

<SliderPrimitive.Root
	type="single"
	{value}
	{onValueChange}
	{min}
	{max}
	{step}
	{disabled}
	class="slider {element ?? ''} {className}"
>
	<span class="slider-track">
		<SliderPrimitive.Range class="slider-range" />
	</span>
	<SliderPrimitive.Thumb index={0} class="slider-thumb" />
</SliderPrimitive.Root>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/layout' as *;

	:global(.slider) {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
		height: calc($unit * 2.5);
		touch-action: none;
		user-select: none;

		&[data-disabled] {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	:global(.slider-track) {
		position: relative;
		flex-grow: 1;
		height: $unit-half;
		background: var(--slider-track-bg, var(--button-bg));
		border-radius: $full-corner;
		overflow: hidden;
	}

	:global(.slider-range) {
		position: absolute;
		height: 100%;
		background: var(--slider-range-bg, var(--accent-blue));
		border-radius: $full-corner;
	}

	:global(.slider-thumb) {
		display: block;
		width: calc($unit * 2.75);
		height: calc($unit * 2.75);
		background: var(--slider-thumb-bg, white);
		border: none;
		border-radius: $full-corner;
		box-shadow: 0 0 4px rgba(0, 0, 0, 0.25);
		cursor: grab;
		@include smooth-transition($duration-quick, transform, box-shadow);

		&:hover {
			transform: scale(1.1);
		}

		&:active {
			cursor: grabbing;
		}

		&:focus-visible {
			outline: none;
			box-shadow: 0 0 0 3px var(--slider-focus-ring, rgba(59, 130, 246, 0.3));
		}
	}

	// Element-specific colors
	:global(.slider.wind) {
		--slider-range-bg: var(--wind-button-bg);
		--slider-focus-ring: var(--wind-nav-selected-bg);
	}

	:global(.slider.fire) {
		--slider-range-bg: var(--fire-button-bg);
		--slider-focus-ring: var(--fire-nav-selected-bg);
	}

	:global(.slider.water) {
		--slider-range-bg: var(--water-button-bg);
		--slider-focus-ring: var(--water-nav-selected-bg);
	}

	:global(.slider.earth) {
		--slider-range-bg: var(--earth-button-bg);
		--slider-focus-ring: var(--earth-nav-selected-bg);
	}

	:global(.slider.dark) {
		--slider-range-bg: var(--dark-button-bg);
		--slider-focus-ring: var(--dark-nav-selected-bg);
	}

	:global(.slider.light) {
		--slider-range-bg: var(--light-button-bg);
		--slider-focus-ring: var(--light-nav-selected-bg);
	}
</style>
