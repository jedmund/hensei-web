<!-- SparkTile - One item's wide art, with the Sparked badge and a rate-up mark; fills the width it's given -->

<script lang="ts">
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import ceruleanSpark from '$src/assets/icons/cerulean-spark.svg'
	import { m } from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import {
		gachaItemFallbackImage,
		gachaItemImage,
		gachaItemName,
		type GachaArt
	} from '$lib/utils/gacha'
	import type { CatalogueItem } from '$lib/types/gacha'
	import { getElementTypeKey } from '$lib/utils/element'

	interface Props {
		item: CatalogueItem
		sparked: boolean
		/** A rate-up on the banner the spark was drawn on */
		rateUp?: boolean
		/** Load the art when it scrolls near; the export loads it straight away */
		lazy?: boolean
		/** A character weapon's character art (the default), or the weapon's own */
		art?: GachaArt
		/** The item's name, shown on hover; left out of the exported image */
		tooltip?: string
		/** A second, quieter line, e.g. a weapon's character */
		tooltipDetail?: string
	}

	let {
		item,
		sparked,
		rateUp = false,
		lazy = false,
		art = 'character',
		tooltip,
		tooltipDetail
	}: Props = $props()

	// The sparked mark takes the item's element, like elemental buttons
	const element = $derived(getElementTypeKey(item.element))

	// One fallback attempt per image, so a missing fallback can't loop
	function useFallback(event: Event) {
		const img = event.currentTarget as HTMLImageElement
		const fallback = gachaItemFallbackImage(item, art)
		if (fallback && !img.dataset.fallback) {
			img.dataset.fallback = 'true'
			img.src = fallback
		}
	}
</script>

{#snippet tile()}
	<div
		class="spark-tile"
		class:sparked
		style:--sparked={element ? `var(--${element}-button-bg)` : undefined}
	>
		<img
			class="art"
			src={gachaItemImage(item, art)}
			alt={gachaItemName(item, getLocale())}
			loading={lazy ? 'lazy' : 'eager'}
			onerror={useFallback}
		/>
		{#if rateUp}
			<!-- A rate-up on the spark's banner: an up arrow in the top-left corner -->
			<span class="rate-up" role="img" aria-label={m.spark_rate_up()}>
				<Icon name="arrow-up" size="60%" />
			</span>
		{/if}
		{#if sparked}
			<!-- The game's Cerulean Spark crystal marks the sparked item -->
			<img class="badge" src={ceruleanSpark} alt={m.spark_sparked()} />
		{/if}
	</div>
{/snippet}

{#if tooltip}
	<Tooltip content={tooltip} class="spark-tile-tooltip">
		{#snippet body()}
			<span class="tooltip-name">{tooltip}</span>
			{#if tooltipDetail}
				<span class="tooltip-detail">{tooltipDetail}</span>
			{/if}
		{/snippet}
		{@render tile()}
	</Tooltip>
{:else}
	{@render tile()}
{/if}

<style lang="scss">
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	// Portalled into the tooltip, so styled globally
	:global(.tooltip-content .tooltip-name),
	:global(.tooltip-content .tooltip-detail) {
		display: block;
	}

	:global(.tooltip-content .tooltip-detail) {
		opacity: 0.7;
		font-weight: $normal;
	}

	// The tooltip's trigger wraps the tile; keep it the tile's size
	:global(.spark-tile-tooltip) {
		display: block;
	}

	.spark-tile {
		position: relative;
		width: 100%;
		aspect-ratio: 280 / 160;
		border-radius: $item-corner-small;
		overflow: hidden;
		// The badge sizes itself against the tile
		container-type: inline-size;

		// The sparked item stands apart from the ones that were drawn
		&.sparked {
			outline: 3px solid var(--sparked, var(--accent-blue));
			outline-offset: -3px;
		}

		.art {
			display: block;
			width: 100%;
			height: 100%;
			object-fit: cover;
			background: var(--placeholder-bg);
		}
	}

	// Sized with the tile, in its top-left corner
	.rate-up {
		position: absolute;
		top: calc(1cqi + 2px);
		left: calc(1cqi + 2px);
		display: flex;
		align-items: center;
		justify-content: center;
		width: clamp(21px, 19.5cqi, 45px);
		aspect-ratio: 1;
		border: 1.5px solid white;
		border-radius: 50%;
		box-sizing: border-box;
		// The unit's element, like the sparked outline
		background: var(--sparked, var(--accent-blue));
		color: white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
		pointer-events: none;
	}

	// Sized with the tile, in its bottom-right corner
	.badge {
		position: absolute;
		right: calc(1cqi + 2px);
		bottom: calc(1cqi + 2px);
		width: clamp(22px, 26cqi, 60px);
		height: auto;
		pointer-events: none;
	}
</style>
