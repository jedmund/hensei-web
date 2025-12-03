<script lang="ts">
	/**
	 * QuantityCounter - Compact +/- counter for selecting quantities
	 *
	 * Used in the add to collection modal for weapons/summons where
	 * users can add multiple copies of the same item.
	 */

	interface Props {
		value?: number
		min?: number
		max?: number
		onChange?: (value: number) => void
	}

	let { value = 0, min = 0, max = 99, onChange }: Props = $props()

	function increment() {
		if (value < max) {
			onChange?.(value + 1)
		}
	}

	function decrement() {
		if (value > min) {
			onChange?.(value - 1)
		}
	}

	function handleKeyDown(e: KeyboardEvent, action: 'increment' | 'decrement') {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			if (action === 'increment') {
				increment()
			} else {
				decrement()
			}
		}
	}
</script>

<div class="quantity-counter" class:active={value > 0}>
	<button
		type="button"
		class="counter-btn"
		onclick={decrement}
		onkeydown={(e) => handleKeyDown(e, 'decrement')}
		disabled={value <= min}
		aria-label="Decrease quantity"
	>
		−
	</button>
	<span class="value" aria-live="polite">{value}</span>
	<button
		type="button"
		class="counter-btn"
		onclick={increment}
		onkeydown={(e) => handleKeyDown(e, 'increment')}
		disabled={value >= max}
		aria-label="Increase quantity"
	>
		+
	</button>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/effects' as *;

	.quantity-counter {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		background: var(--surface-overlay, rgba(0, 0, 0, 0.4));
		border-radius: 4px;
		padding: 2px;
		@include smooth-transition(0.15s, all);

		&.active {
			background: var(--accent-color, #3366ff);
		}
	}

	.counter-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		padding: 0;
		border: none;
		background: transparent;
		color: white;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		border-radius: 2px;
		@include smooth-transition(0.1s, all);

		&:hover:not(:disabled) {
			background: rgba(255, 255, 255, 0.2);
		}

		&:disabled {
			opacity: 0.4;
			cursor: not-allowed;
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring, white);
			outline-offset: 1px;
		}
	}

	.value {
		min-width: 20px;
		text-align: center;
		font-size: 12px;
		font-weight: 600;
		color: white;
	}
</style>
