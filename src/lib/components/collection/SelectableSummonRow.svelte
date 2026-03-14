<script lang="ts">
	/**
	 * SelectableSummonRow - List view summon selection with quantity counter
	 *
	 * Used in the add to collection modal for selecting summons with
	 * quantity support (users can own multiple copies).
	 */
	import { localizedName } from '$lib/utils/locale'
	import { getSummonImage } from '$lib/utils/images'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
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

	const name = $derived(localizedName(summon.name))

	const element = $derived(summon.element)

	function handleQuantityChange(value: number) {
		onQuantityChange?.(summon, value)
	}

	function handleClick() {
		// Clicking the row increments quantity (convenience)
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
	@use '$src/themes/layout' as layout;

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
		border-radius: layout.$card-corner;
		transition:
			background 0.15s,
			box-shadow 0.15s;

		&:hover {
			background: var(--list-cell-bg-hover);
			box-shadow: var(--shadow-md);
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
		border-radius: layout.$bubble-menu-item-corner;
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
