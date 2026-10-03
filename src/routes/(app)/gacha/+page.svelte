<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import CopyableText from '$lib/components/ui/CopyableText.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Notice from '$lib/components/ui/Notice.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import GachaItemPicker from '$lib/components/gacha/GachaItemPicker.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import jpFlag from '$src/assets/flags/jp.png'
	import usFlag from '$src/assets/flags/us.png'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { gachaItemImage, gachaItemName, gachaItemThumbnail } from '$lib/utils/gacha'
	import type { CatalogueItem, GachaResult } from '$lib/types/gacha'

	type Operation = 'draw' | 'until' | 'odds'
	type Currency = 'usd' | 'jpy' | 'crystals'

	let operation = $state<Operation>('draw')
	let mode = $state('premium')
	let season = $state('')
	let purchase = $state<'ten' | 'singles'>('ten')
	let draws = $state('300')
	let copies = $state('1')
	let comparison = $state<'at_least' | 'exactly'>('at_least')
	let target = $state('')
	let rateups = $state<{ identity: string; percent: string }[]>([])
	let items = $state<CatalogueItem[]>([])
	let result = $state<GachaResult | null>(null)
	let busy = $state(false)
	let loading = $state(true)
	let failure = $state('')
	let targetError = $state('')
	let currency = $state<Currency>(getLocale() === 'ja' ? 'jpy' : 'usd')
	let art = $state<'weapon' | 'character'>('weapon')
	let runController: AbortController | undefined

	// Base SSR rates, matching the API's simulation: 6% for the galas, 3% otherwise
	const ssrRates: Record<string, number> = {
		premium: 0.03,
		legend: 0.06,
		flash: 0.06,
		classic: 0.03,
		classic_ii: 0.03,
		classic_iii: 0.03
	}
	const modeOptions = $derived(
		[
			{ value: 'premium', label: m.gacha_premium() },
			{ value: 'legend', label: m.gacha_legend() },
			{ value: 'flash', label: m.gacha_flash() },
			{ value: 'classic', label: m.gacha_classic() },
			{ value: 'classic_ii', label: m.gacha_classic_ii() },
			{ value: 'classic_iii', label: m.gacha_classic_iii() }
		].map((option) => ({
			...option,
			suffix: new Intl.NumberFormat(getLocale(), { style: 'percent' }).format(
				ssrRates[option.value] ?? 0.03
			)
		}))
	)
	const seasonOptions = $derived([
		{ value: '', label: m.gacha_none() },
		{ value: 'valentines', label: m.gacha_valentines() },
		{ value: 'summer', label: m.gacha_summer() },
		{ value: 'halloween', label: m.gacha_halloween() },
		{ value: 'holiday', label: m.gacha_holiday() },
		{ value: 'formal', label: m.gacha_formal() }
	])
	const purchaseOptions = $derived([
		{ value: 'ten' as const, label: m.gacha_ten() },
		{ value: 'singles' as const, label: m.gacha_singles() }
	])
	const comparisonOptions = $derived([
		{ value: 'at_least' as const, label: m.gacha_at_least() },
		{ value: 'exactly' as const, label: m.gacha_exactly() }
	])

	const classic = $derived(mode.startsWith('classic'))
	const ssrs = $derived(items.filter((item) => item.rarity === 3))
	const rateCandidates = $derived(
		ssrs.filter((item) => !rateups.some((rate) => rate.identity === item.identity))
	)
	// SSRs in the order they were drawn; runs too large for the API to report
	// an order fall back to one tile per item with its count
	const drawnSsrs = $derived.by(() => {
		const ssrs = (result?.items ?? []).filter((item) => item.rarity === 3)
		if (!result?.ssr_order) {
			return ssrs.sort((a, b) => Number(b.count ?? 0) - Number(a.count ?? 0))
		}
		const byIdentity = new Map(ssrs.map((item) => [item.identity, item]))
		return result.ssr_order.flatMap((identity) => {
			const item = byIdentity.get(identity)
			return item ? [{ ...item, count: '1' }] : []
		})
	})
	const hasCharacterArt = $derived(drawnSsrs.some((item) => item.recruits?.granblue_id))
	const currencies = $derived<Currency[]>(
		result?.cost.usd ? ['usd', 'jpy', 'crystals'] : ['jpy', 'crystals']
	)
	const shownCurrency = $derived(currencies.includes(currency) ? currency : 'jpy')
	const flags: Partial<Record<Currency, string>> = { usd: usFlag, jpy: jpFlag }

	const name = (item: CatalogueItem) => gachaItemName(item, getLocale())
	const itemFor = (identity: string) => items.find((item) => item.identity === identity)

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

	/** Parse a proxy response, turning non-JSON or failed responses into readable errors */
	async function readJson(response: Response) {
		const isJson = response.headers.get('Content-Type')?.includes('application/json')
		const data = isJson ? await response.json().catch(() => null) : null
		if (!data || response.status >= 500) throw new Error(m.gacha_error())
		if (!response.ok) throw new Error(data.error || data.message || m.gacha_error())
		return data
	}

	$effect(() => {
		const query = `mode=${encodeURIComponent(mode)}${!classic && season ? `&season=${encodeURIComponent(season)}` : ''}`
		const controller = new AbortController()
		loading = true
		failure = ''
		fetch(`/api/gacha/catalogue?${query}`, { signal: controller.signal })
			.then(async (response) => {
				const data = await readJson(response)
				items = data.items
				result = null
				target = ''
				rateups = []
			})
			.catch((error) => {
				if (!controller.signal.aborted) failure = String(error.message)
			})
			.finally(() => {
				if (!controller.signal.aborted) loading = false
			})
		return () => controller.abort()
	})
	$effect(() => () => runController?.abort())

	async function run(replay = false) {
		if (busy) return
		if (!replay && operation !== 'draw' && !target) {
			targetError = m.gacha_target_required()
			return
		}
		busy = true
		failure = ''
		runController = new AbortController()
		const signal = runController.signal
		const payload =
			replay && result
				? {
						...result.configuration,
						draws: result.draws,
						seed: result.seed,
						target: result.target,
						copies: Number(result.requested_copies ?? 1),
						comparison: result.comparison
					}
				: {
						mode,
						season: classic ? null : season || null,
						purchase,
						draws,
						copies: Number(copies),
						comparison,
						target,
						rateups
					}
		try {
			let response = await fetch(`/api/gacha/${operation === 'draw' ? 'simulations' : operation}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
				signal
			})
			let data = await readJson(response)
			if (data.token) {
				const token = data.token
				const deadline = Date.now() + 10 * 60_000
				while (Date.now() < deadline) {
					await new Promise((resolve) => setTimeout(resolve, 1500))
					response = await fetch(`/api/gacha/jobs/${token}`, { signal })
					data = await readJson(response)
					if (data.status === 'failed') throw new Error(data.error || m.gacha_error())
					if (data.status === 'complete') {
						data = data.result
						break
					}
				}
				if (!data.draws) throw new Error(m.gacha_error())
			}
			result = data
		} catch (error) {
			if (!signal.aborted) failure = error instanceof Error ? error.message : m.gacha_error()
		} finally {
			busy = false
		}
	}

	function selectOperation(value: string) {
		operation = value as Operation
		targetError = ''
		result = null
	}
	function addRate(identity: string) {
		if (identity && !rateups.some((rate) => rate.identity === identity)) {
			rateups = [...rateups, { identity, percent: '0.3' }]
		}
	}
	function removeRate(identity: string) {
		rateups = rateups.filter((rate) => rate.identity !== identity)
	}
</script>

<PageMeta title={m.gacha_title()} description={m.gacha_notice()} />

{#snippet tile(label: string, value: string)}
	<div class="tile">
		<span class="stat-label">{label}</span>
		<span class="stat-value">{value}</span>
	</div>
{/snippet}

<div class="gacha-page">
	<form
		class="card"
		onsubmit={(event) => {
			event.preventDefault()
			void run()
		}}
	>
		<div>
			<SegmentedControl
				value={operation}
				onValueChange={selectOperation}
				size="small"
				variant="background"
				grow
			>
				<Segment value="draw" disabled={busy}>{m.gacha_draw()}</Segment>
				<Segment value="until" disabled={busy}>{m.gacha_until()}</Segment>
				<Segment value="odds" disabled={busy}>{m.gacha_odds()}</Segment>
			</SegmentedControl>
		</div>
		<div class="fields">
			<Select contained label={m.gacha_mode()} options={modeOptions} bind:value={mode} fullWidth />
			<!-- Classic pools have no seasons; the choice is kept for other pools -->
			<Select
				contained
				label={m.gacha_season()}
				options={seasonOptions}
				value={classic ? '' : season}
				onValueChange={(value) => (season = value ?? '')}
				disabled={classic}
				fullWidth
			/>
			<Select
				contained
				label={m.gacha_purchase()}
				options={purchaseOptions}
				bind:value={purchase}
				fullWidth
			/>
			{#if operation !== 'until'}
				<Input
					contained
					label={m.gacha_draws()}
					type="number"
					min={purchase === 'ten' ? 10 : 1}
					step={purchase === 'ten' ? 10 : 1}
					bind:value={draws}
					required
					fullWidth
				/>
			{/if}
		</div>

		{#if operation !== 'draw'}
			<div class="fields">
				<div class="wide">
					<GachaItemPicker
						contained
						label={m.gacha_target()}
						placeholder={m.gacha_target_placeholder()}
						{items}
						bind:value={target}
						onValueChange={() => (targetError = '')}
						error={targetError}
						disabled={loading}
					/>
				</div>
				<Input
					contained
					label={m.gacha_copies()}
					type="number"
					min="1"
					max="1000"
					bind:value={copies}
					required
					fullWidth
				/>
				{#if operation === 'odds'}
					<Select
						contained
						label={m.gacha_comparison()}
						options={comparisonOptions}
						bind:value={comparison}
						fullWidth
					/>
				{/if}
			</div>
		{/if}

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
						onclick={() => removeRate(rate.identity)}
					/>
				</div>
			{/each}
			<GachaItemPicker
				contained
				placeholder={m.gacha_add()}
				items={rateCandidates}
				clearOnSelect
				onValueChange={addRate}
				disabled={loading}
			/>
		</section>

		<div class="actions">
			<Button variant="primary" type="submit" disabled={loading || busy}>
				{busy ? m.gacha_running() : m.gacha_run()}
			</Button>
		</div>
	</form>

	{#if failure}
		<Notice variant="red">{failure}</Notice>
	{/if}

	{#if result}
		<section class="card results" aria-live="polite">
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
				{#if operation === 'draw' && hasCharacterArt}
					<SegmentedControl
						value={art}
						onValueChange={(value) => (art = value as typeof art)}
						size="xsmall"
						variant="background"
					>
						<Segment value="weapon">{m.collection_tab_weapons()}</Segment>
						<Segment value="character">{m.collection_tab_characters()}</Segment>
					</SegmentedControl>
				{/if}
			</div>

			{#if drawnSsrs.length > 0}
				<ul class="drawn">
					{#each drawnSsrs as item, index (index)}
						<li title={name(item)}>
							<img src={gachaItemImage(item, art)} alt={name(item)} />
							{#if Number(item.count) > 1}
								<span class="count">×{amount(item.count ?? '0')}</span>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}

			<footer class="meta">
				<div class="cost">
					<button type="button" onclick={nextCurrency}>
						{#if flags[shownCurrency]}
							<img class="flag" src={flags[shownCurrency]} alt="" />
						{:else}
							<Icon name="crystal" size={16} />
						{/if}
						{cost(result.cost, shownCurrency)}
					</button>
				</div>
				<span class="seed">
					{m.gacha_replay_seed()}
					<CopyableText value={result.seed} />
				</span>
				<Button variant="ghost" size="small" disabled={busy} onclick={() => void run(true)}>
					{m.gacha_replay()}
				</Button>
			</footer>
		</section>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/mixins' as *;

	.gacha-page {
		max-width: var(--main-max-width);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: $unit-2x;

		h2 {
			margin: 0;
		}
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

	.fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: $unit-2x;

		.wide {
			grid-column: span 2;

			@media (max-width: 450px) {
				grid-column: auto;
			}
		}
	}

	.rateups {
		display: flex;
		flex-direction: column;
		gap: $unit;

		h2 {
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

	.actions {
		display: flex;
		justify-content: flex-end;
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

		li {
			position: relative;
		}

		img {
			display: block;
			width: 100%;
			aspect-ratio: 280 / 160;
			object-fit: cover;
			border-radius: $item-corner-small;
			background: var(--placeholder-bg);
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

	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: $unit-2x;
		padding-top: $unit-2x;
		border-top: 1px solid var(--separator-bg);
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
</style>
