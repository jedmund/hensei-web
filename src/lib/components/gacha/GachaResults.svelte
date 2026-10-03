<!-- GachaResults - Result card for the gacha simulator page and its share image -->

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import CopyableText from '$lib/components/ui/CopyableText.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import RichTooltip from '$lib/components/ui/RichTooltip.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import jpFlag from '$src/assets/flags/jp.png'
	import usFlag from '$src/assets/flags/us.png'
	import * as m from '$lib/paraglide/messages'
	import { getElementKey } from '$lib/utils/element'
	import { getLocale } from '$lib/paraglide/runtime'
	import { onMount } from 'svelte'
	import { toast } from 'svelte-sonner'
	import { copyResultImage, gachaImageUrl } from '$lib/utils/gachaImage'
	import {
		gachaItemAlternateImage,
		gachaItemDetailImage,
		gachaItemFallbackImage,
		gachaItemImage,
		gachaItemKind,
		gachaItemName
	} from '$lib/utils/gacha'
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
	// One fallback attempt per image, so a missing fallback can't loop
	function useFallback(event: Event, item: CatalogueItem) {
		const img = event.currentTarget as HTMLImageElement
		const fallback = gachaItemFallbackImage(item, art)
		if (fallback && !img.dataset.fallback) {
			img.dataset.fallback = 'true'
			img.src = fallback
		}
	}

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
	const hasCharacterArt = $derived(drawnSsrs.some((item) => item.recruits?.granblue_id))
	const currencies = $derived<Currency[]>(
		result.cost.usd ? ['usd', 'jpy', 'crystals'] : ['jpy', 'crystals']
	)
	const shownCurrency = $derived(currencies.includes(currency) ? currency : 'jpy')
	const flags: Partial<Record<Currency, string>> = { usd: usFlag, jpy: jpFlag }

	const name = (item: CatalogueItem) => gachaItemName(item, getLocale())

	function amount(value: string) {
		const [integer = '0', fraction = ''] = value.split('.')
		const decimals = fraction.replace(/0+$/, '')
		return `${BigInt(integer).toLocaleString(getLocale())}${decimals ? `.${decimals}` : ''}`
	}
	function percent(value: number) {
		return new Intl.NumberFormat(getLocale(), {
			style: 'percent',
			maximumSignificantDigits: 4
		}).format(value)
	}
	function rate(part: string, whole: string) {
		return new Intl.NumberFormat(getLocale(), {
			style: 'percent',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(Number(part) / Number(whole))
	}
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
	function decimal(value: number) {
		return new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 2 }).format(value)
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
		const targetName = target ? name(target) : ''
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

{#snippet tile(label: string, value: string)}
	<div class="tile">
		<span class="stat-label">{label}</span>
		<span class="stat-value">{value}</span>
	</div>
{/snippet}

{#snippet drawnImage(item: CatalogueItem)}
	<img
		src={gachaItemImage(item, art)}
		alt={name(item)}
		onerror={(event) => useFallback(event, item)}
	/>
{/snippet}

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
	<div class="results-head">
		<div class="stats">
			{#if operation === 'draw' && result.totals}
				<div class="tiles">
					{@render tile(m.gacha_ssr_rate(), rate(result.totals.SSR, result.draws))}
					{#each ['SSR', 'SR', 'R'] as const as rarity (rarity)}
						{@render tile(rarity, amount(result.totals[rarity]))}
					{/each}
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
								<span class="target-name">{name(target)}</span>
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
					{@render tile(m.gacha_probability(), percent(result.probability))}
					{#if result.expected_copies !== undefined}
						{@render tile(m.gacha_expected(), decimal(result.expected_copies))}
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
		{#if !share && operation === 'draw' && hasCharacterArt}
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

	{#if drawnSsrs.length > 0}
		<ul
			class="drawn"
			style:--share-columns={share ? shareColumns : undefined}
			bind:clientWidth={artWidth}
			bind:clientHeight={artHeight}
		>
			{#each drawnSsrs as item, index (index)}
				{@const alternate = share ? undefined : gachaItemAlternateImage(item, art)}
				<li title={alternate ? undefined : name(item)}>
					{#if alternate}
						<!-- The character for a weapon, or the weapon for a character -->
						<RichTooltip class="drawn-trigger">
							{#snippet content()}
								<img class="alternate" src={alternate} alt="" />
							{/snippet}
							{@render drawnImage(item)}
						</RichTooltip>
					{:else}
						{@render drawnImage(item)}
					{/if}
					{#if Number(item.count) > 1}
						<span class="count">×{amount(item.count ?? '0')}</span>
					{/if}
				</li>
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
	@use '$src/themes/mixins' as *;

	.card {
		background: var(--card-bg);
		color: var(--text-primary);
		border: $card-border;
		border-radius: $page-corner;
		box-shadow: $page-elevation;
		padding: $unit-3x;
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
	}

	.tiles {
		display: grid;
		grid-template-columns: repeat(var(--columns, 4), minmax(0, 1fr));
		gap: $unit;
		width: 100%;

		@media (max-width: 450px) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.tile {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		padding: $unit-2x;
		border-radius: $card-corner;
		background: var(--page-bg);
	}

	.results-head {
		display: flex;
		flex-direction: column-reverse;
		align-items: flex-start;
		gap: $unit-2x;

		.stats {
			width: 100%;
		}
	}

	.stats {
		display: flex;
		flex-direction: column;
		gap: $unit;
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
	}

	.drawn {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
		gap: $unit;

		// Fixed tile shape, so a missing image can't change the row height
		li {
			position: relative;
			aspect-ratio: 280 / 160;
			overflow: hidden;
			border-radius: $item-corner-small;
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

	// Inside the tooltip, which is portalled out of the card
	.alternate {
		display: block;
		width: 140px;
		aspect-ratio: 280 / 160;
		object-fit: cover;
		border-radius: $item-corner-small;
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
	.share.until {
		.results-head,
		.stats,
		.target {
			flex: 1;
			min-height: 0;
		}

		.target {
			height: auto;
		}
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
