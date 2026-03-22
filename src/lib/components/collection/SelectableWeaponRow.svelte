<script lang="ts">
	/**
	 * SelectableWeaponRow - List view weapon selection with quantity counter
	 *
	 * Used in the add to collection modal for selecting weapons with
	 * quantity support (users can own multiple copies).
	 */
	import { getWeaponImage, getWeaponFallbackImage, handleImageFallback } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import QuantityCounter from './QuantityCounter.svelte'
	import type { SearchPageResult } from '$lib/api/queries/search.queries'

	type SearchResultItem = SearchPageResult['results'][number]

	interface Props {
		weapon: SearchResultItem
		quantity?: number
		onQuantityChange?: (weapon: SearchResultItem, quantity: number) => void
		/** User's element for counter styling */
		userElement?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	}

	let { weapon, quantity = 0, onQuantityChange, userElement }: Props = $props()

	const imageUrl = $derived(getWeaponImage(weapon.granblueId, 'square', weapon.element === 0 ? 0 : undefined))

	const weaponFallbackUrl = $derived(
		weapon.element === 0 ? getWeaponFallbackImage(weapon.granblueId, 'square') : undefined
	)

	const name = $derived(localizedName(weapon.name))

	const element = $derived(weapon.element)

	function handleQuantityChange(value: number) {
		onQuantityChange?.(weapon, value)
	}

	function handleClick() {
		// Clicking the row increments quantity (convenience)
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
	class="row"
	class:selected={quantity > 0}
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={handleKeyDown}
	aria-label="Select {name}, current quantity: {quantity}"
>
	<!-- onclick stops propagation to prevent row click from firing -->
	<div class="counter-cell" onclick={(e) => e.stopPropagation()}>
		<QuantityCounter value={quantity} onChange={handleQuantityChange} element={userElement} />
	</div>

	<div class="thumbnail">
		<img src={imageUrl} alt={name} loading="lazy" onerror={(e) => handleImageFallback(e, weaponFallbackUrl)} />
	</div>

	<span class="name">{name}</span>

	<div class="element-cell">
		<ElementLabel {element} size="medium" />
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as layout;

	.row {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit $unit-2x $unit $unit;
		border: none;
		background: transparent;
		cursor: pointer;
		width: 100%;
		text-align: left;
		border-radius: layout.$card-corner;
		transition:
			background 0.15s,
			box-shadow 0.15s;

		&:hover {
			background: var(--list-cell-bg-hover);
		}

		&:focus-visible {
			outline: 2px solid var(--accent-blue);
			outline-offset: -2px;
		}
	}

	.counter-cell {
		flex-shrink: 0;
	}

	.thumbnail {
		width: 64px;
		height: 64px;
		border-radius: layout.$bubble-menu-item-corner;
		overflow: hidden;
		background: var(--card-bg);
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}
	}

	.name {
		flex: 1;
		font-size: $font-regular;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.element-cell {
		flex-shrink: 0;
	}
</style>
