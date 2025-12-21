<script lang="ts">
	/**
	 * MetricField - Single metric input with label suffix (B, C, S)
	 *
	 * A compact number input with a single-letter label inside the container.
	 */

	interface Props {
		/** Numeric value (null for empty) */
		value?: number | null
		/** Single-letter label (e.g., "B", "C", "S") */
		label: string
		/** Max allowed value */
		max?: number
		/** Whether the input is disabled */
		disabled?: boolean
		/** Use contained background style */
		contained?: boolean
	}

	let {
		value = $bindable(null),
		label,
		max = 999,
		disabled = false,
		contained = false
	}: Props = $props()

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement
		if (target.value === '') {
			value = null
		} else {
			const parsed = parseInt(target.value, 10)
			value = isNaN(parsed) ? null : Math.max(0, Math.min(max, parsed))
		}
	}
</script>

<div class="metric-field" class:disabled class:contained>
	<input
		type="number"
		min="0"
		{max}
		placeholder="—"
		value={value ?? ''}
		oninput={handleInput}
		{disabled}
		class="metric-input"
	/>
	<span class="metric-label">{label}</span>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	.metric-field {
		display: flex;
		align-items: center;
		gap: $unit-half;
		background-color: var(--input-bg);
		border-radius: $input-corner;
		padding: $unit $unit-2x;
		@include smooth-transition($duration-quick, background-color);

		&:hover:not(.disabled) {
			background-color: var(--input-bg-hover);
		}

		&:focus-within:not(.disabled) {
			outline: 2px solid $water-text-20;
			outline-offset: -2px;
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		&.contained {
			background-color: var(--input-bound-bg);

			&:hover:not(.disabled) {
				background-color: var(--input-bound-bg-hover);
			}
		}
	}

	.metric-input {
		width: 40px;
		background: transparent;
		border: none;
		color: var(--text-primary);
		font-size: $font-regular;
		font-family: inherit;
		font-variant-numeric: tabular-nums;
		text-align: center;
		padding: $unit-half 0;
		outline: none;

		// Hide number input spinners
		appearance: textfield;
		-moz-appearance: textfield;
		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			appearance: none;
			-webkit-appearance: none;
			margin: 0;
		}

		&::placeholder {
			color: var(--text-tertiary);
		}

		&:disabled {
			cursor: not-allowed;
		}
	}

	.metric-label {
		font-size: $font-regular;
		font-weight: $bold;
		color: var(--text-secondary);
	}
</style>
