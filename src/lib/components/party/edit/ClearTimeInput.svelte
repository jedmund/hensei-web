<script lang="ts">
	/**
	 * ClearTimeInput - Duration input for party clear time (MM:SS format)
	 *
	 * Displays minutes and seconds as separate inputs styled as a unified field.
	 * Value is stored/emitted as total seconds.
	 */
	import { untrack } from 'svelte'

	interface Props {
		/** Clear time in seconds (e.g., 225 = 3:45) */
		value?: number | null
		/** Callback when value changes */
		onchange?: (seconds: number | null) => void
		/** Whether the input is disabled */
		disabled?: boolean
		/** Use contained background style */
		contained?: boolean
	}

	let { value = $bindable(), onchange, disabled = false, contained = false }: Props = $props()

	// Convert seconds to minutes/seconds
	function secondsToMinutes(totalSeconds: number | null | undefined): {
		minutes: number | null
		seconds: number | null
	} {
		if (totalSeconds == null || totalSeconds < 0) {
			return { minutes: null, seconds: null }
		}
		return {
			minutes: Math.floor(totalSeconds / 60),
			seconds: totalSeconds % 60
		}
	}

	// Convert minutes/seconds to total seconds
	function toTotalSeconds(
		minutes: number | null | undefined,
		seconds: number | null | undefined
	): number | null {
		if (minutes == null && seconds == null) return null
		const m = minutes ?? 0
		const s = seconds ?? 0
		return m * 60 + s
	}

	// Local state
	let { minutes, seconds } = $state(secondsToMinutes(value))

	// Sync from external value changes only
	$effect(() => {
		const parsed = secondsToMinutes(value)
		untrack(() => {
			if (parsed.minutes !== minutes || parsed.seconds !== seconds) {
				minutes = parsed.minutes
				seconds = parsed.seconds
			}
		})
	})

	function handleMinutesChange(e: Event) {
		const target = e.target as HTMLInputElement
		const val = target.value === '' ? null : parseInt(target.value, 10)
		minutes = val != null && !isNaN(val) ? Math.max(0, val) : null
		emitChange()
	}

	function handleSecondsChange(e: Event) {
		const target = e.target as HTMLInputElement
		const val = target.value === '' ? null : parseInt(target.value, 10)
		// Clamp seconds to 0-59
		seconds = val != null && !isNaN(val) ? Math.min(59, Math.max(0, val)) : null
		emitChange()
	}

	function emitChange() {
		const total = toTotalSeconds(minutes, seconds)
		value = total
		onchange?.(total)
	}
</script>

<div class="clear-time-input" class:disabled class:contained>
	<div class="segment">
		<input
			type="number"
			min="0"
			max="999"
			placeholder="0"
			value={minutes ?? ''}
			oninput={handleMinutesChange}
			{disabled}
			class="time-input minutes"
		/>
		<span class="label">min</span>
	</div>
	<span class="separator">:</span>
	<div class="segment">
		<input
			type="number"
			min="0"
			max="59"
			placeholder="00"
			value={seconds != null ? String(seconds).padStart(2, '0') : ''}
			oninput={handleSecondsChange}
			{disabled}
			class="time-input seconds"
		/>
		<span class="label">sec</span>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	.clear-time-input {
		display: flex;
		align-items: center;
		gap: $unit;
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

	.segment {
		display: flex;
		align-items: center;
		gap: $unit-half;
	}

	.time-input {
		width: 48px;
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

		&.seconds {
			width: 36px;
		}
	}

	.label {
		font-size: $font-small;
		color: var(--text-secondary);
	}

	.separator {
		font-size: $font-regular;
		color: var(--text-secondary);
		font-weight: $medium;
	}
</style>
