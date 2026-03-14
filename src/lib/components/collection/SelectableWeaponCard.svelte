<script lang="ts">
	/**
	 * SelectableWeaponCard - Grid view weapon selection with quantity counter
	 *
	 * Used in the add to collection modal for selecting weapons with
	 * quantity support (users can own multiple copies).
	 */
	import { getWeaponImage } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import QuantityCounter from './QuantityCounter.svelte'
	import type { SearchPageResult } from '$lib/api/queries/search.queries'

	type SearchResultItem = SearchPageResult['results'][number]

	interface Props {
		weapon: SearchResultItem
		quantity?: number
		onQuantityChange?: (weapon: SearchResultItem, quantity: number) => void
	}

	let { weapon, quantity = 0, onQuantityChange }: Props = $props()

	const imageUrl = $derived(getWeaponImage(weapon.granblueId, 'grid', weapon.element === 0 ? 0 : undefined))

	const name = $derived(localizedName(weapon.name))

	function handleQuantityChange(value: number) {
		onQuantityChange?.(weapon, value)
	}

	function handleClick() {
		// Clicking the card increments quantity (convenience)
		onQuantityChange?.(weapon, quantity + 1)
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
	<div class="counter-overlay" onclick={(e) => e.stopPropagation()}>
		<QuantityCounter value={quantity} onChange={handleQuantityChange} />
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/layout' as layout;

	.card {
		position: relative;
		width: 100px;
		// Weapon grid images are typically square or close to it
		aspect-ratio: 1 / 1;
		padding: 0;
		border: 2px solid transparent;
		border-radius: layout.$input-corner;
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
