<!-- GachaResultCard - One drawn SSR in a result's grid, with the other art in its tooltip -->

<script lang="ts">
	import RichTooltip from '$lib/components/ui/RichTooltip.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import { getLocale } from '$lib/paraglide/runtime'
	import { formatAmount } from '$lib/utils/gachaFormat'
	import {
		gachaItemAlternateImage,
		gachaItemFallbackImage,
		gachaItemImage,
		gachaItemKind,
		gachaItemName,
		type GachaArt
	} from '$lib/utils/gacha'
	import type { CatalogueItem } from '$lib/types/gacha'

	interface Props {
		item: CatalogueItem
		art: GachaArt
		/** One of the rate-ups the result was drawn with; it glows */
		rateup: boolean
		/** In the share image: no tooltips, and a steady glow */
		share: boolean
	}

	let { item, art, rateup, share }: Props = $props()

	const name = $derived(gachaItemName(item, getLocale()))
	// The character for a weapon, or the weapon for a character
	const alternate = $derived(share ? undefined : gachaItemAlternateImage(item, art))
	const summon = $derived(!share && gachaItemKind(item) === 'summon')
	// Name for the art in the hover tooltip: the weapon's own name when the
	// tooltip shows the weapon, the character's when it shows the character
	const alternateName = $derived(
		art === 'character' ? (getLocale() === 'ja' && item.name.ja) || item.name.en : name
	)

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

{#snippet drawnImage()}
	<img src={gachaItemImage(item, art)} alt={name} onerror={useFallback} />
{/snippet}

<li title={alternate || summon ? undefined : name} class:rateup class:still={share}>
	{#if alternate}
		<RichTooltip class="drawn-trigger">
			{#snippet content()}
				<figure class="alternate">
					<img src={alternate} alt="" />
					<figcaption>
						{alternateName}
						{#if art === 'weapon' && item.recruits}
							<CharacterTags
								character={{
									element: item.element,
									season: item.recruits.season ?? null,
									series: item.recruits.series ?? []
								}}
							/>
						{/if}
					</figcaption>
				</figure>
			{/snippet}
			{@render drawnImage()}
		</RichTooltip>
	{:else if summon}
		<Tooltip class="drawn-trigger" content={name}>
			{@render drawnImage()}
		</Tooltip>
	{:else}
		{@render drawnImage()}
	{/if}
	{#if Number(item.count) > 1}
		<span class="count">×{formatAmount(item.count ?? '0', getLocale())}</span>
	{/if}
</li>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	// Fixed tile shape, so a missing image can't change the row height
	li {
		position: relative;
		aspect-ratio: 280 / 160;
		overflow: hidden;
		border-radius: $item-corner-small;

		// Rate-ups glow, so they stand out among the other SSRs
		&.rateup {
			box-shadow: 0 0 $unit-half 1px color-mix(in srgb, var(--accent-yellow) 60%, transparent);
			animation: rateup-pulse 2.4s ease-in-out infinite;

			@media (prefers-reduced-motion: reduce) {
				animation: none;
			}
		}

		// The share image is a still; keep the glow steady
		&.rateup.still {
			animation: none;
		}

		img {
			display: block;
			width: 100%;
			height: 100%;
			object-fit: cover;
			border-radius: $item-corner-small;
			background: var(--placeholder-bg);
		}

		:global(.drawn-trigger) {
			display: block;
			height: 100%;
		}
	}

	@keyframes rateup-pulse {
		50% {
			box-shadow: 0 0 $unit 1px color-mix(in srgb, var(--accent-yellow) 80%, transparent);
		}
	}

	// Inside the tooltip, which is portalled out of the card
	.alternate {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit-half;
		width: 140px;
		margin: 0;

		img {
			display: block;
			width: 100%;
			aspect-ratio: 280 / 160;
			object-fit: cover;
			border-radius: $item-corner-small;
		}

		figcaption {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: $unit-half;
			text-align: center;
		}
	}

	.count {
		position: absolute;
		right: $unit-half;
		bottom: $unit-half;
		padding: 0 $unit-half;
		border-radius: $item-corner-small;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		font-size: $font-tiny;
		font-weight: $bold;
	}
</style>
