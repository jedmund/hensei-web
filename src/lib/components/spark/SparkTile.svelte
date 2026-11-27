<!-- SparkTile - One item's wide art, with the Sparked badge; fills the width it's given -->

<script lang="ts">
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import { m } from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import {
		gachaItemFallbackImage,
		gachaItemImage,
		gachaItemName,
		type GachaArt
	} from '$lib/utils/gacha'
	import type { CatalogueItem } from '$lib/types/gacha'

	interface Props {
		item: CatalogueItem
		sparked: boolean
		/** Load the art when it scrolls near; the export loads it straight away */
		lazy?: boolean
		/** A character weapon's character art (the default), or the weapon's own */
		art?: GachaArt
		/** The item's name, shown on hover; left out of the exported image */
		tooltip?: string
		/** A second, quieter line, e.g. a weapon's character */
		tooltipDetail?: string
	}

	let { item, sparked, lazy = false, art = 'character', tooltip, tooltipDetail }: Props = $props()

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
	<div class="spark-tile" class:sparked>
		<img
			src={gachaItemImage(item, art)}
			alt={gachaItemName(item, getLocale())}
			loading={lazy ? 'lazy' : 'eager'}
			onerror={useFallback}
		/>
		{#if sparked}
			<span class="badge">{m.spark_sparked()}</span>
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
			outline: 3px solid var(--accent-blue);
			outline-offset: -3px;
		}

		img {
			display: block;
			width: 100%;
			height: 100%;
			object-fit: cover;
			background: var(--placeholder-bg);
		}
	}

	// Sized with the tile, so it reads at any density
	.badge {
		position: absolute;
		right: 4px;
		bottom: 4px;
		padding: 0.15em 0.5em;
		border-radius: $item-corner-small;
		background: var(--accent-blue);
		color: white;
		font-size: clamp(12px, 12cqi, 24px);
		font-weight: $bold;
		line-height: 1.2;
		pointer-events: none;
	}
</style>
