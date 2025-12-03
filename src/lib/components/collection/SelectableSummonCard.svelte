<script lang="ts">
	/**
	 * SelectableSummonCard - Grid view summon selection with quantity counter
	 *
	 * Used in the add to collection modal for selecting summons with
	 * quantity support (users can own multiple copies).
	 */
	import { getSummonImage } from '$lib/utils/images'
	import QuantityCounter from './QuantityCounter.svelte'
	import type { SearchPageResult } from '$lib/api/queries/search.queries'

	type SearchResultItem = SearchPageResult['results'][number]

	interface Props {
		summon: SearchResultItem
		quantity?: number
		onQuantityChange?: (summon: SearchResultItem, quantity: number) => void
	}

	let { summon, quantity = 0, onQuantityChange }: Props = $props()

	const imageUrl = $derived(getSummonImage(summon.granblueId, 'grid'))

	const name = $derived(
		typeof summon.name === 'string'
			? summon.name
			: summon.name?.en || summon.name?.ja || 'Unknown'
	)

	function handleQuantityChange(value: number) {
		onQuantityChange?.(summon, value)
	}

	function handleClick() {
		// Clicking the card increments quantity (convenience)
		onQuantityChange?.(summon, quantity + 1)
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			handleClick()
		}
	}
</script>

<div
	class="card"
	class:selected={quantity > 0}
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={handleKeyDown}
	aria-label="Select {name}, current quantity: {quantity}"
>
	<img src={imageUrl} alt={name} class="image" loading="lazy" />
	<div class="counter-overlay" onclick|stopPropagation={() => {}}>
		<QuantityCounter value={quantity} onChange={handleQuantityChange} />
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/effects' as *;

	.card {
		position: relative;
		width: 100px;
		// Summon grid images are typically square
		aspect-ratio: 1 / 1;
		padding: 0;
		border: 2px solid transparent;
		border-radius: 8px;
		background: var(--card-bg, #f5f5f5);
		cursor: pointer;
		overflow: hidden;
		flex-shrink: 0;
		@include smooth-transition(0.15s, all);

		&:hover {
			border-color: var(--accent-color, #3366ff);
			transform: scale(1.02);
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring, #3366ff);
			outline-offset: 2px;
		}

		&.selected {
			border-color: var(--accent-color, #3366ff);
			box-shadow: 0 0 0 2px var(--accent-color, #3366ff);
		}
	}

	.image {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.counter-overlay {
		position: absolute;
		bottom: 4px;
		right: 4px;
	}
</style>
