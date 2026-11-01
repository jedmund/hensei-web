<!-- GachaResultSummary - A result's tallies: SSRs and rates for Draw, the target and copies for Until, chances for Odds -->

<script lang="ts">
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getElementKey } from '$lib/utils/element'
	import { getLocale } from '$lib/paraglide/runtime'
	import {
		formatAmount,
		formatDecimal,
		formatProbability,
		formatRate
	} from '$lib/utils/gachaFormat'
	import {
		gachaItemDetailImage,
		gachaItemImage,
		gachaItemKind,
		gachaItemName
	} from '$lib/utils/gacha'
	import type { CatalogueItem, GachaRenderData, GachaResult } from '$lib/types/gacha'

	interface Props {
		result: GachaResult
		operation: GachaRenderData['operation']
		/** The Until target, shown large above the tallies */
		target?: CatalogueItem | undefined
		/** How many rate-ups the result was drawn with */
		rateupCount: number
		/** How many of the drawn SSRs were rate-ups */
		rateupHits: number
		/** In the share image, Until's target fills the card */
		fill: boolean
	}

	let { result, operation, target, rateupCount, rateupHits, fill }: Props = $props()

	const amount = (value: string) => formatAmount(value, getLocale())
</script>

{#snippet tile(label: string, value: string)}
	<div class="tile">
		<span class="stat-label">{label}</span>
		<span class="stat-value">{value}</span>
	</div>
{/snippet}

<div class="stats" class:fill>
	{#if operation === 'draw' && result.totals}
		<div class="tiles" style:--columns={rateupCount > 0 ? 3 : 2}>
			{@render tile(m.gacha_ssr_rate(), formatRate(result.totals.SSR, result.draws, getLocale()))}
			{@render tile('SSR', amount(result.totals.SSR))}
			{#if rateupCount > 0}
				{@render tile(m.gacha_rateups_hit(), amount(String(rateupHits)))}
			{/if}
		</div>
	{:else if operation === 'until'}
		{#if target}
			<div
				class="target"
				style:--tint={target.element > 0
					? `color-mix(in srgb, var(--${getElementKey(target.element)}-bg) 25%, var(--page-bg))`
					: undefined}
			>
				<img
					src={gachaItemDetailImage(target)}
					class:whole={gachaItemKind(target) === 'weapon'}
					alt=""
					onerror={(event) => {
						// The grid art, once, when the detail art is missing
						const img = event.currentTarget as HTMLImageElement
						if (img.dataset.fallback) return
						img.dataset.fallback = 'true'
						img.src = gachaItemImage(target)
					}}
				/>
				<div class="target-text">
					<span class="stat-label">{m.gacha_target()}</span>
					<span class="target-title">
						<span class="target-name">{gachaItemName(target, getLocale())}</span>
						{#if target.element > 0}
							<ElementLabel element={target.element} size="medium" />
						{/if}
					</span>
				</div>
			</div>
		{/if}
		<div class="tiles" style:--columns="2">
			{@render tile(m.gacha_sampled(), amount(result.draws))}
			{@render tile(m.gacha_copies(), amount(result.copies ?? '0'))}
		</div>
	{:else if result.probability !== undefined}
		<div class="tiles" style:--columns="2">
			{@render tile(m.gacha_probability(), formatProbability(result.probability, getLocale()))}
			{#if result.expected_copies !== undefined}
				{@render tile(m.gacha_expected(), formatDecimal(result.expected_copies, getLocale()))}
			{/if}
		</div>
		{#if result.thresholds}
			<div class="tiles" style:--columns="3">
				{#each ['50', '90', '95'] as level (level)}
					{@const threshold = result.thresholds[level]}
					{@render tile(
						m.gacha_chance({ percent: level }),
						threshold ? amount(threshold) : m.gacha_beyond()
					)}
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.stats {
		display: flex;
		flex-direction: column;
		gap: $unit;
		width: 100%;
	}

	.tiles {
		display: grid;
		grid-template-columns: repeat(var(--columns, 3), minmax(0, 1fr));
		gap: $unit;
		width: 100%;
	}

	.tile {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		padding: $unit-2x;
		border-radius: $card-corner;
		background: var(--page-bg);
	}

	.stat-label {
		color: var(--text-secondary);
		font-size: $font-small;
		font-weight: $medium;
	}

	.stat-value {
		font-size: $font-xxlarge;
		font-weight: $bold;
		font-variant-numeric: tabular-nums;

		// Three tiles share a row on phones
		@media (max-width: 450px) {
			font-size: $font-large;
		}
	}

	.target {
		position: relative;
		display: flex;
		align-items: flex-end;
		height: 228px;
		padding: $unit-2x;
		border-radius: $card-corner;
		// Tinted with the target's element; plain page background otherwise
		background: var(--tint, var(--page-bg));
		overflow: hidden;

		// The art covers the banner; weapon art (nearly square) stays whole
		img {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
			object-fit: cover;
			object-position: center 20%;

			&.whole {
				left: auto;
				width: 50%;
				object-fit: contain;
				object-position: right center;
			}
		}

		// Fade from the left so the name stays readable over the art
		&::after {
			content: '';
			position: absolute;
			inset: 0;
			background: linear-gradient(
				90deg,
				var(--tint, var(--page-bg)) 0%,
				color-mix(in srgb, var(--tint, var(--page-bg)) 60%, transparent) 30%,
				transparent 55%
			);
		}

		@media (max-width: 450px) {
			flex-direction: column;
			align-items: stretch;
			height: auto;
			padding: 0;

			img {
				position: static;
				width: 100%;
				max-width: 100%;
				height: 160px;
				object-fit: cover;
				object-position: center top;

				// Weapon art is nearly square; keep it whole
				&.whole {
					object-fit: contain;
					object-position: center;
				}
			}

			&::after {
				content: none;
			}

			.target-text {
				padding: $unit-2x;
			}
		}
	}

	.target-text {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: $unit-half;
	}

	.target-title {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: $unit;
	}

	.target-name {
		font-size: $font-xxlarge;
		font-weight: $bold;
	}

	// Until has no art grid, so in the share image the target fills the card
	.fill {
		&,
		.target {
			flex: 1;
			min-height: 0;
		}

		.target {
			height: auto;
		}
	}
</style>
