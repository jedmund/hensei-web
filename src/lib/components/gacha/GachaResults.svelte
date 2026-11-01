<!-- GachaResults - Result card for the gacha simulator page and its share image -->

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import CopyableText from '$lib/components/ui/CopyableText.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import GachaResultCard from '$lib/components/gacha/GachaResultCard.svelte'
	import GachaResultSummary from '$lib/components/gacha/GachaResultSummary.svelte'
	import jpFlag from '$src/assets/flags/jp.png'
	import usFlag from '$src/assets/flags/us.png'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { onMount } from 'svelte'
	import { toast } from 'svelte-sonner'
	import { copyResultImage, gachaImageUrl } from '$lib/utils/gachaImage'
	import { formatAmount } from '$lib/utils/gachaFormat'
	import { gachaItemName } from '$lib/utils/gacha'
	import type { CatalogueItem, GachaRenderData, GachaResult } from '$lib/types/gacha'

	type Currency = GachaRenderData['currency']
	type Art = GachaRenderData['art']

	interface Props {
		result: GachaResult
		operation: GachaRenderData['operation']
		currency?: Currency
		art?: Art
		/** The Until target, shown large above the result */
		target?: CatalogueItem
		/** Static layout for the share image: no controls, capped art */
		share?: boolean
		/** Pool and season, shown at the top left of the share image */
		label?: string
		/** Title on the card's first line, beside the art switch */
		heading?: string
		/**
		 * Query string of the settings the result came from, plus its seed.
		 * Turns on Share and Copy; links and images are built from it rather
		 * than the form, so later edits can't pair the seed with other settings.
		 */
		link?: string
	}

	let {
		result,
		operation,
		currency = $bindable('usd'),
		art = $bindable('character'),
		share = false,
		label,
		heading,
		target,
		link
	}: Props = $props()

	// The share image shows every SSR, choosing the column count that gives
	// the largest tiles that still fit; at least five columns so a few pulls
	// don't turn into a few huge tiles
	const SHARE_MIN_COLUMNS = 5
	const ART_GAP = 8
	const ART_RATIO = 160 / 280
	let artWidth = $state(0)
	let artHeight = $state(0)

	// SSRs in the order they were drawn; runs too large for the API to report
	// an order fall back to one tile per item with its count
	const drawnSsrs = $derived.by(() => {
		const ssrs = (result.items ?? []).filter((item) => item.rarity === 3)
		if (!result.ssr_order) {
			return ssrs.sort((a, b) => Number(b.count ?? 0) - Number(a.count ?? 0))
		}
		const byIdentity = new Map(ssrs.map((item) => [item.identity, item]))
		return result.ssr_order.flatMap((identity) => {
			const item = byIdentity.get(identity)
			return item ? [{ ...item, count: '1' }] : []
		})
	})

	const shareColumns = $derived.by(() => {
		const count = drawnSsrs.length
		if (!artWidth || !artHeight || count === 0) return SHARE_MIN_COLUMNS
		for (let columns = SHARE_MIN_COLUMNS; columns < count; columns++) {
			const tileHeight = ((artWidth - (columns - 1) * ART_GAP) / columns) * ART_RATIO
			const rows = Math.ceil(count / columns)
			if (rows * tileHeight + (rows - 1) * ART_GAP <= artHeight) return columns
		}
		return Math.max(count, SHARE_MIN_COLUMNS)
	})
	// Rate-ups the result was drawn with, and how many of the drawn SSRs
	// were one of them
	const rateups = $derived(
		new Set((result.configuration?.rateups ?? []).map((rate) => rate.identity))
	)
	const rateupHits = $derived(
		drawnSsrs.reduce(
			(total, item) => (rateups.has(item.identity) ? total + Number(item.count ?? 1) : total),
			0
		)
	)
	const hasCharacterArt = $derived(drawnSsrs.some((item) => item.recruits?.granblue_id))
	const showArtSwitch = $derived(!share && operation === 'draw' && hasCharacterArt)
	const currencies = $derived<Currency[]>(
		result.cost.usd ? ['usd', 'jpy', 'crystals'] : ['jpy', 'crystals']
	)
	const shownCurrency = $derived(currencies.includes(currency) ? currency : 'jpy')
	const flags: Partial<Record<Currency, string>> = { usd: usFlag, jpy: jpFlag }

	const amount = (value: string) => formatAmount(value, getLocale())

	function cost(value: GachaResult['cost'], unit: Currency) {
		if (unit === 'crystals') return `${amount(value.crystals)} ${m.gacha_crystals()}`
		return new Intl.NumberFormat(getLocale(), {
			style: 'currency',
			currency: unit === 'usd' ? 'USD' : 'JPY'
		}).format(Number(unit === 'usd' ? value.usd : value.jpy))
	}
	function nextCurrency() {
		currency = currencies[(currencies.indexOf(shownCurrency) + 1) % currencies.length] ?? 'jpy'
	}

	// The system share sheet, only on touch-first devices (phones and tablets)
	// where it's what people expect; desktops use Copy
	let canShare = $state(false)
	onMount(() => {
		canShare =
			typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches
	})

	function shareText() {
		const draws = amount(result.draws)
		const targetName = target ? gachaItemName(target, getLocale()) : ''
		if (operation === 'until' && targetName) {
			return m.gacha_share_until({ name: targetName, draws })
		}
		if (operation === 'odds' && targetName && result.probability !== undefined) {
			const chance = new Intl.NumberFormat(getLocale(), {
				style: 'percent',
				maximumSignificantDigits: 3
			}).format(result.probability)
			return m.gacha_share_odds({ percent: chance, name: targetName, draws })
		}
		return m.gacha_share_draw({ ssr: amount(result.totals?.SSR ?? '0'), draws })
	}

	async function shareResult() {
		try {
			await navigator.share({
				title: m.page_title_gacha(),
				text: shareText(),
				url: `${window.location.origin}${window.location.pathname}?${link}`
			})
		} catch (error) {
			// Closing the share sheet isn't an error
			if (error instanceof DOMException && error.name === 'AbortError') return
			toast.error(m.gacha_error())
		}
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(window.location.href)
			toast.success(m.toast_copied())
		} catch {
			toast.error(m.toast_copy_failed())
		}
	}

	function copyImage() {
		if (!link) return
		const url = gachaImageUrl(link, {
			art,
			currency,
			lang: getLocale() === 'ja' ? 'ja' : 'en'
		})
		copyResultImage(url)
			.then((outcome) =>
				toast.success(outcome === 'copied' ? m.toast_copied() : m.gacha_image_saved())
			)
			.catch(() => toast.error(m.toast_copy_failed()))
	}
</script>

{#snippet currencyMark()}
	{#if flags[shownCurrency]}
		<img class="flag" src={flags[shownCurrency]} alt="" />
	{:else}
		<Icon name="crystal" size={16} />
	{/if}
	{cost(result.cost, shownCurrency)}
{/snippet}

<section
	class="card results"
	class:share
	class:until={operation === 'until'}
	aria-live={share ? undefined : 'polite'}
>
	{#if share && label}
		<div class="share-label">{label}</div>
	{/if}
	{#if heading || showArtSwitch}
		<div class="results-title">
			{#if heading}
				<h2>{heading}</h2>
			{/if}
			{#if showArtSwitch}
				<SegmentedControl
					value={art}
					onValueChange={(value) => (art = value as Art)}
					size="xsmall"
					variant="background"
				>
					<Segment value="character">{m.collection_tab_characters()}</Segment>
					<Segment value="weapon">{m.collection_tab_weapons()}</Segment>
				</SegmentedControl>
			{/if}
		</div>
	{/if}
	<div class="results-head">
		<GachaResultSummary
			{result}
			{operation}
			{target}
			rateupCount={rateups.size}
			{rateupHits}
			fill={share && operation === 'until'}
		/>
	</div>

	{#if drawnSsrs.length > 0}
		<ul
			class="drawn"
			style:--share-columns={share ? shareColumns : undefined}
			bind:clientWidth={artWidth}
			bind:clientHeight={artHeight}
		>
			{#each drawnSsrs as item, index (index)}
				<GachaResultCard {item} {art} {share} rateup={rateups.has(item.identity)} />
			{/each}
		</ul>
	{/if}

	<footer class="meta">
		{#if share}
			<div class="cost">
				<span class="cost-text">{@render currencyMark()}</span>
			</div>
			<span class="wordmark">granblue.team</span>
		{:else}
			<div class="cost">
				<button type="button" onclick={nextCurrency}>
					{@render currencyMark()}
				</button>
			</div>
			<span class="seed">
				{m.gacha_replay_seed()}
				<CopyableText value={result.seed} />
			</span>
			{#if link && canShare}
				<Button variant="ghost" size="small" onclick={shareResult}>
					{m.gacha_share()}
				</Button>
			{/if}
			{#if link}
				<DropdownMenu>
					{#snippet trigger({ props })}
						<Button {...props} variant="ghost" size="small" rightIcon="chevron-down-small">
							{m.gacha_copy()}
						</Button>
					{/snippet}
					{#snippet menu()}
						<DropdownMenuBase.Item class="dropdown-menu-item" onSelect={copyLink}>
							{m.gacha_copy_link()}
						</DropdownMenuBase.Item>
						<DropdownMenuBase.Item class="dropdown-menu-item" onSelect={copyImage}>
							{m.gacha_copy_image()}
						</DropdownMenuBase.Item>
					{/snippet}
				</DropdownMenu>
			{/if}
		{/if}
	</footer>
</section>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	.card {
		@include page-card;
	}

	// The heading on the left and the art switch on the right; without a
	// heading, the switch stays on the left
	.results-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit-2x;

		h2 {
			margin: 0;
			font-size: $font-regular;
			font-weight: $medium;
		}
	}

	.drawn {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
		gap: $unit;
	}

	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: $unit-2x;
		color: var(--text-secondary);
		font-size: $font-small;
	}

	.cost {
		flex: 1;

		button {
			all: unset;
			display: inline-flex;
			align-items: center;
			gap: $unit-half;
			margin-left: -$unit;
			padding: $unit-half $unit;
			border-radius: $item-corner-small;
			cursor: pointer;
			@include smooth-transition($duration-quick, background-color, color);

			&:hover {
				background-color: var(--option-bg-hover);
				color: var(--text-primary);
			}

			&:focus-visible {
				outline: 2px solid $blue;
			}
		}

		.cost-text {
			display: inline-flex;
			align-items: center;
			gap: $unit-half;
		}

		.flag {
			width: 16px;
			height: 16px;
		}
	}

	.seed {
		display: flex;
		align-items: center;
		gap: $unit;
	}

	// Share image: ten tiles per row so three rows fit the 1200x630 frame
	.share {
		box-shadow: none;
		flex: 1;
		min-height: 0;

		.drawn {
			flex: 1;
			min-height: 0;
			overflow: hidden;
			align-content: start;
			gap: 8px;
			grid-template-columns: repeat(var(--share-columns), minmax(0, 1fr));
		}

		.meta {
			margin-top: auto;
		}
	}

	// Until has no art grid, so in the share image the target fills the card;
	// columns down to it, so its flex reaches the card's height
	.share.until .results-head {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	.share-label {
		align-self: flex-start;
		margin-bottom: -$unit;
		color: var(--text-secondary);
		font-size: $font-regular;
		font-weight: $medium;
	}

	.wordmark {
		color: var(--text-tertiary);
		font-weight: $medium;
	}
</style>
