<script lang="ts">
	/**
	 * Stepper - [−] value [+] control for stepping a small integer.
	 *
	 * `canIncrement` lets a caller block a step for reasons beyond `max`
	 * (e.g. a cost limit). The value is muted at `min`, the base level.
	 */
	import Button from './Button.svelte'

	interface Props {
		value: number
		min?: number
		max: number
		onChange: (value: number) => void
		canIncrement?: boolean
		format?: (value: number) => string
		decreaseLabel: string
		increaseLabel: string
		/** Accessible name for the group, e.g. the item being stepped */
		label?: string
		/** Matches the height of a Select or Input of the same size */
		size?: 'small' | 'medium' | 'large'
	}

	let {
		value,
		min = 0,
		max,
		onChange,
		canIncrement = true,
		format = (v: number) => String(v),
		decreaseLabel,
		increaseLabel,
		label,
		size = 'medium'
	}: Props = $props()
</script>

<div class="stepper {size}" role="group" aria-label={label}>
	<Button
		variant="ghost"
		size="small"
		iconOnly
		icon="minus"
		disabled={value <= min}
		aria-label={decreaseLabel}
		onclick={() => onChange(value - 1)}
	/>
	<span class="value" class:base={value <= min} aria-live="polite">{format(value)}</span>
	<Button
		variant="ghost"
		size="small"
		iconOnly
		icon="plus"
		disabled={value >= max || !canIncrement}
		aria-label={increaseLabel}
		onclick={() => onChange(value + 1)}
	/>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	// Heights match Select and Input at each size (small 28px, medium 38px,
	// large 56px). The buttons fill the height inside the padding.
	.stepper {
		--stepper-height: calc(#{$unit} * 4.75);

		display: inline-flex;
		align-items: center;
		gap: $unit-half;
		height: var(--stepper-height);
		padding: $unit-fourth;
		// The buttons' corner plus the padding, so the curves stay concentric
		border-radius: calc(#{$input-corner} + #{$unit-fourth});
		background: var(--input-bound-bg);

		&.small {
			--stepper-height: calc(#{$unit} * 3.5);
		}

		&.large {
			--stepper-height: calc(#{$unit} * 7);
		}

		:global([data-button-root]) {
			width: calc(var(--stepper-height) - #{$unit-half}) !important;
			height: calc(var(--stepper-height) - #{$unit-half}) !important;
			min-height: 0;
			padding: 0 !important;
		}
	}

	.value {
		min-width: $unit-3x;
		text-align: center;
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;

		.small & {
			font-size: $font-small;
		}

		.large & {
			font-size: $font-large;
		}

		&.base {
			color: var(--text-secondary);
		}
	}
</style>
