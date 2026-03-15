<script lang="ts">
	/**
	 * SelectableSummonCard - Grid view summon selection with quantity counter
	 *
	 * Used in the add to collection modal for selecting summons with
	 * quantity support (users can own multiple copies).
	 */
	import { localizedName } from '$lib/utils/locale'
	import { getSummonImage } from '$lib/utils/images'
	import QuantityCounter from './QuantityCounter.svelte'
	import type { SearchPageResult } from '$lib/api/queries/search.queries'

	type SearchResultItem = SearchPageResult['results'][number]

	interface Props {
		summon: SearchResultItem
		quantity?: number
		onQuantityChange?: (summon: SearchResultItem, quantity: number) => void
		userElement?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	}

	let { summon, quantity = 0, onQuantityChange, userElement }: Props = $props()

	const imageUrl = $derived(getSummonImage(summon.granblueId, 'wide'))

	const name = $derived(localizedName(summon.name))

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
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={handleKeyDown}
	aria-label="Select {name}, current quantity: {quantity}"
>
	<img src={imageUrl} alt={name} class="image" loading="lazy" />
	<div class="counter-row" onclick={(e) => e.stopPropagation()}>
		<QuantityCounter value={quantity} onChange={handleQuantityChange} element={userElement} />
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/layout' as layout;

	.card {
		display: flex;
		flex-direction: column;
		width: 140px;
		padding: 0;
		border-radius: layout.$input-corner;
		background: var(--card-bg);
		cursor: pointer;
		overflow: hidden;
		flex-shrink: 0;
		@include smooth-transition(0.15s, transform);

		&:hover {
			transform: scale(1.02);
		}

		&:focus-visible {
			outline: 2px solid var(--accent-blue);
			outline-offset: 2px;
		}
	}

	.image {
		width: 100%;
		aspect-ratio: 280 / 160;
		object-fit: cover;
	}

	.counter-row {
		display: flex;
		padding: $unit-fourth;

		:global(.quantity-counter) {
			width: 100%;
		}

		:global(.counter-btn) {
			flex: 1;
		}

		:global(.value) {
			min-width: 28px;
		}
	}
</style>
