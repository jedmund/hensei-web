<!-- GachaRateups - Rate-up list for the gacha simulator: SSRs with a custom rate -->

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import GachaItemPicker from '$lib/components/gacha/GachaItemPicker.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { gachaItemName, gachaItemThumbnail } from '$lib/utils/gacha'
	import type { CatalogueItem } from '$lib/types/gacha'

	export interface Rateup {
		identity: string
		percent: string
	}

	interface Props {
		/** The pool's SSRs */
		ssrs: CatalogueItem[]
		rateups: Rateup[]
		disabled?: boolean
	}

	let { ssrs, rateups = $bindable(), disabled = false }: Props = $props()

	const candidates = $derived(
		ssrs.filter((item) => !rateups.some((rate) => rate.identity === item.identity))
	)

	const name = (item: CatalogueItem) => gachaItemName(item, getLocale())
	const itemFor = (identity: string) => ssrs.find((item) => item.identity === identity)

	function add(identity: string) {
		if (identity && !rateups.some((rate) => rate.identity === identity)) {
			rateups = [...rateups, { identity, percent: '0.3' }]
		}
	}
	function remove(identity: string) {
		rateups = rateups.filter((rate) => rate.identity !== identity)
	}
</script>

<section class="rateups">
	<h2>{m.gacha_rates()}</h2>
	{#each rateups as rate (rate.identity)}
		{@const item = itemFor(rate.identity)}
		<div class="rateup">
			{#if item}
				<img src={gachaItemThumbnail(item)} alt="" />
				<span class="rateup-name">{name(item)}</span>
			{/if}
			<div class="rateup-percent">
				<Input
					contained
					type="text"
					inputmode="decimal"
					aria-label={m.gacha_rate()}
					bind:value={rate.percent}
					size="small"
					alignRight
				/>
				<span>%</span>
			</div>
			<Button
				variant="ghost"
				size="small"
				iconOnly
				icon="close"
				aria-label={m.gacha_remove()}
				type="button"
				onclick={() => remove(rate.identity)}
			/>
		</div>
	{/each}
	<GachaItemPicker
		contained
		placeholder={m.gacha_search_items()}
		items={candidates}
		clearOnSelect
		onValueChange={add}
		{disabled}
	/>
</section>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.rateups {
		display: flex;
		flex-direction: column;
		gap: $unit;

		h2 {
			margin: 0;
			font-size: $font-small;
			font-weight: $medium;
		}
	}

	.rateup {
		display: flex;
		align-items: center;
		gap: $unit;

		img {
			width: 32px;
			aspect-ratio: 1;
			object-fit: cover;
			border-radius: $item-corner-small;
			background: var(--placeholder-bg);

			// 25% larger on desktop
			@media (min-width: 769px) {
				width: 40px;
			}
		}
	}

	.rateup-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.rateup-percent {
		display: flex;
		align-items: center;
		gap: $unit-half;
		width: 96px;
		color: var(--text-secondary);
	}
</style>
