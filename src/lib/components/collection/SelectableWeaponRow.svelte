<script lang="ts">
	/**
	 * SelectableWeaponRow - List view weapon selection with quantity counter
	 *
	 * Used in the add to collection modal for selecting weapons with
	 * quantity support (users can own multiple copies).
	 */
	import { getWeaponImage } from '$lib/utils/images'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import QuantityCounter from './QuantityCounter.svelte'
	import type { SearchPageResult } from '$lib/api/queries/search.queries'

	type SearchResultItem = SearchPageResult['results'][number]

	interface Props {
		weapon: SearchResultItem
		quantity?: number
		onQuantityChange?: (weapon: SearchResultItem, quantity: number) => void
	}

	let { weapon, quantity = 0, onQuantityChange }: Props = $props()

	const imageUrl = $derived(getWeaponImage(weapon.granblueId, 'grid'))

	const name = $derived(
		typeof weapon.name === 'string'
			? weapon.name
			: weapon.name?.en || weapon.name?.ja || 'Unknown'
	)

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
	<div class="counter-cell" onclick|stopPropagation={() => {}}>
		<QuantityCounter value={quantity} onChange={handleQuantityChange} />
	</div>

	<div class="thumbnail">
		<img src={imageUrl} alt={name} loading="lazy" />
	</div>

	<span class="name">{name}</span>

	<div class="element-cell">
		<ElementLabel {element} size="medium" />
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.row {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit $unit-2x $unit $unit;
		border: none;
		background: var(--list-cell-bg);
		cursor: pointer;
		width: 100%;
		text-align: left;
		border-radius: 12px;
		transition:
			background 0.15s,
			box-shadow 0.15s;

		&:hover {
			background: var(--list-cell-bg-hover);
			box-shadow: 0 0 8px rgba(0, 0, 0, 0.08);
		}

		&:focus-visible {
			outline: 2px solid var(--accent-color, #3366ff);
			outline-offset: -2px;
		}

		&.selected {
			background: rgba(51, 102, 255, 0.1);

			&:hover {
				background: rgba(51, 102, 255, 0.15);
			}
		}
	}

	.counter-cell {
		flex-shrink: 0;
	}

	.thumbnail {
		width: 80px;
		aspect-ratio: 1 / 1;
		border-radius: 6px;
		overflow: hidden;
		background: var(--card-bg, #f5f5f5);
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
