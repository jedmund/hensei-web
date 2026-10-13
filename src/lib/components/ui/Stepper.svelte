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
		label
	}: Props = $props()
</script>

<div class="stepper" role="group" aria-label={label}>
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

	.stepper {
		display: inline-flex;
		align-items: center;
		gap: $unit-half;
		padding: $unit-fourth;
		// The buttons' corner plus the padding, so the curves stay concentric
		border-radius: calc(#{$input-corner} + #{$unit-fourth});
		background: var(--input-bg);
	}

	.value {
		min-width: $unit-3x;
		text-align: center;
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;

		&.base {
			color: var(--text-secondary);
		}
	}
</style>
