<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Notice from '$lib/components/ui/Notice.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import GachaItemPicker from '$lib/components/gacha/GachaItemPicker.svelte'
	import GachaResults from '$lib/components/gacha/GachaResults.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { onMount, untrack } from 'svelte'
	import { slide } from 'svelte/transition'
	import { MediaQuery } from 'svelte/reactivity'
	import { toast } from 'svelte-sonner'
	import { page } from '$app/state'
	import { replaceState } from '$app/navigation'
	import { readShare, seasonalPool, writeShare, type GachaShare } from '$lib/utils/gachaShare'
	import { copyResultImage, gachaImageUrl } from '$lib/utils/gachaImage'
	import { getSimplePortraits } from '$lib/stores/simplePortraits.svelte'
	import { gachaItemName, gachaItemThumbnail } from '$lib/utils/gacha'
	import type { CatalogueItem, GachaResult } from '$lib/types/gacha'

	let { data } = $props()
	const simplePortraits = getSimplePortraits()

	type Operation = 'draw' | 'until' | 'odds'
	type Currency = 'usd' | 'jpy' | 'crystals'

	// Settings start from the URL so shared links open as they were sent. The
	// target and rate-ups wait for the catalogue, which resolves their ids.
	// A fresh visit opens on the pool that's likely running today; links with
	// settings keep theirs, since they leave Premium out of the query
	const shared = page.url.search
		? readShare(page.url.searchParams)
		: { ...readShare(page.url.searchParams), mode: seasonalPool() }
	let pendingShare: GachaShare | null = shared
	let restored = $state(false)

	let operation = $state<Operation>(shared.operation)
	let mode = $state(shared.mode)
	let season = $state(shared.season)
	let purchase = $state<'ten' | 'singles'>(shared.purchase)
	let draws = $state(shared.draws)
	let copies = $state(shared.copies)
	let comparison = $state<'at_least' | 'exactly'>(shared.comparison)
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
	// The settings a result was produced with; the link carries its seed only
	// while the settings still match
	let resultShare = $state('')

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

	const name = (item: CatalogueItem) => gachaItemName(item, getLocale())
	const itemFor = (identity: string) => items.find((item) => item.identity === identity)

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
				const share = pendingShare
				pendingShare = null
				target = share ? identityFor(share.target) : ''
				rateups = share
					? share.rateups.flatMap(({ id, percent }) => {
							const identity = identityFor(id, 3)
							return identity ? [{ identity, percent }] : []
						})
					: []
				restored = true
				if (share?.seed) untrack(() => void run(share.seed))
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

	// The settings card collapses to the mode switcher and Draw button, and
	// collapses on its own when a draw starts
	const isMobile = new MediaQuery('(max-width: 768px)')
	let collapsed = $state(false)

	async function run(seed = '') {
		if (busy) return
		if (operation !== 'draw' && !target) {
			targetError = m.gacha_target_required()
			collapsed = false
			return
		}
		collapsed = true
		busy = true
		failure = ''
		runController = new AbortController()
		const signal = runController.signal
		const payload = {
			mode,
			season: classic ? null : season || null,
			purchase,
			draws,
			copies: Number(copies),
			comparison,
			target,
			rateups,
			...(seed ? { seed } : {})
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
			resultShare = currentShare()
		} catch (error) {
			if (!signal.aborted) failure = error instanceof Error ? error.message : m.gacha_error()
		} finally {
			busy = false
		}
	}

	function identityFor(granblueId: string, rarity?: number) {
		if (!granblueId) return ''
		return (
			items.find(
				(item) =>
					item.granblue_id === granblueId && (rarity === undefined || item.rarity === rarity)
			)?.identity ?? ''
		)
	}
	function granblueIdFor(identity: string) {
		return items.find((item) => item.identity === identity)?.granblue_id ?? ''
	}
	function currentShare(seed = '') {
		return writeShare({
			operation,
			mode,
			season: classic ? '' : season,
			purchase,
			draws: String(draws),
			copies: String(copies),
			comparison,
			target: granblueIdFor(target),
			rateups: rateups.flatMap((rate) => {
				const id = granblueIdFor(rate.identity)
				return id ? [{ id, percent: String(rate.percent) }] : []
			}),
			seed
		})
	}

	// Keep the address bar in step with the settings, adding the seed while
	// the shown result still matches them. Updates are applied on a timer
	// against the real address bar, so one queued before the result arrives
	// can't win over the newer one.
	let wantedQuery = ''
	let syncScheduled = false
	function syncUrl() {
		syncScheduled = false
		const search = wantedQuery ? `?${wantedQuery}` : ''
		if (window.location.search === search) return
		try {
			replaceState(`${window.location.pathname}${search}`, page.state)
		} catch {
			// Right after hydration the router may not accept history updates yet
			syncScheduled = true
			setTimeout(syncUrl, 50)
		}
	}
	$effect(() => {
		if (!restored) return
		const settings = currentShare()
		wantedQuery = result && resultShare === settings ? currentShare(result.seed) : settings
		if (!syncScheduled) {
			syncScheduled = true
			setTimeout(syncUrl, 0)
		}
	})

	// Built from the settings the result came from, so later edits to the form
	// can't pair the seed with different settings
	function copyImage() {
		if (!result) return
		const query = `${resultShare ? `${resultShare}&` : ''}seed=${encodeURIComponent(result.seed)}`
		copyResultImage(
			gachaImageUrl(query, {
				art,
				currency,
				lang: getLocale() === 'ja' ? 'ja' : 'en',
				simplePortraits: simplePortraits.value
			})
		)
			.then((outcome) =>
				toast.success(outcome === 'copied' ? m.toast_copied() : m.gacha_image_saved())
			)
			.catch(() => toast.error(m.toast_copy_failed()))
	}

	// The system share sheet, where the browser has one (iOS, Android, Safari,
	// Edge); the button is hidden elsewhere and Copy link covers it
	// Only on touch-first devices (phones and tablets), where the share sheet
	// is what people expect; desktops use Copy
	let canShare = $state(false)
	onMount(() => {
		canShare =
			typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches
	})

	function shareText(shown: GachaResult) {
		const count = (value: string | undefined) => Number(value ?? 0).toLocaleString(getLocale())
		const targetItem = items.find((item) => item.identity === shown.target)
		const targetName = targetItem ? name(targetItem) : ''
		if (operation === 'until' && targetName) {
			return m.gacha_share_until({ name: targetName, draws: count(shown.draws) })
		}
		if (operation === 'odds' && targetName && shown.probability !== undefined) {
			const chance = new Intl.NumberFormat(getLocale(), {
				style: 'percent',
				maximumSignificantDigits: 3
			}).format(shown.probability)
			return m.gacha_share_odds({ percent: chance, name: targetName, draws: count(shown.draws) })
		}
		return m.gacha_share_draw({ ssr: count(shown.totals?.SSR), draws: count(shown.draws) })
	}

	// Shares the link to the shown result: the settings it came from plus its
	// seed, whatever the form says now
	async function shareResult() {
		if (!result) return
		const query = `${resultShare ? `${resultShare}&` : ''}seed=${encodeURIComponent(result.seed)}`
		try {
			await navigator.share({
				title: m.page_title_gacha(),
				text: shareText(result),
				url: `${window.location.origin}${window.location.pathname}?${query}`
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

<PageMeta
	title={m.page_title_gacha()}
	description={m.page_desc_gacha()}
	image={data.ogImage ?? undefined}
	imageWidth={1200}
	imageHeight={630}
/>

<div class="gacha-page">
	<form
		class="card"
		onsubmit={(event) => {
			event.preventDefault()
			void run()
		}}
	>
		<div class="card-head">
			<div class="operation">
				<SegmentedControl
					value={operation}
					onValueChange={selectOperation}
					size="small"
					variant="background"
					grow
				>
					<Segment value="draw" disabled={busy}>{m.gacha_draw()}</Segment>
					<Segment value="until" disabled={busy}>
						{isMobile.current ? m.gacha_until_short() : m.gacha_until()}
					</Segment>
					<Segment value="odds" disabled={busy}>{m.gacha_odds()}</Segment>
				</SegmentedControl>
			</div>
			<Button
				variant="ghost"
				size="small"
				iconOnly
				icon={collapsed ? 'chevron-down' : 'chevron-up'}
				aria-label={collapsed ? m.gacha_show_settings() : m.gacha_hide_settings()}
				aria-expanded={!collapsed}
				aria-controls="gacha-settings"
				type="button"
				onclick={() => (collapsed = !collapsed)}
			/>
		</div>
		{#if !collapsed}
			<div class="settings" id="gacha-settings" transition:slide={{ duration: 150 }}>
				<div class="fields">
					<Select
						contained
						label={m.gacha_mode()}
						options={modeOptions}
						bind:value={mode}
						fullWidth
					/>
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
								placeholder={m.gacha_search_items()}
								items={ssrs}
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
								type="button"
								onclick={() => removeRate(rate.identity)}
							/>
						</div>
					{/each}
					<GachaItemPicker
						contained
						placeholder={m.gacha_search_items()}
						items={rateCandidates}
						clearOnSelect
						onValueChange={addRate}
						disabled={loading}
					/>
				</section>
			</div>
		{/if}

		<div class="actions">
			{#if collapsed && rateups.length > 0}
				<ul class="collapsed-rateups" aria-label={m.gacha_rates()}>
					{#each rateups as rate (rate.identity)}
						{@const item = itemFor(rate.identity)}
						{#if item}
							<li title="{name(item)} {rate.percent}%">
								<img src={gachaItemThumbnail(item)} alt={name(item)} />
							</li>
						{/if}
					{/each}
				</ul>
			{/if}
			<Button variant="primary" type="submit" disabled={loading || busy}>
				{m.gacha_run()}
			</Button>
		</div>
	</form>

	{#if failure}
		<Notice variant="red">{failure}</Notice>
	{/if}

	{#if result}
		<GachaResults
			{result}
			target={items.find((item) => item.identity === result?.target)}
			simplePortraits={simplePortraits.value}
			{operation}
			bind:currency
			bind:art
			onShare={canShare ? shareResult : undefined}
			onCopyLink={copyLink}
			onCopyImage={copyImage}
		/>
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

	.card-head {
		display: flex;
		align-items: center;
		gap: $unit;
	}

	.operation {
		flex: 1;
		min-width: 0;
	}

	.settings {
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

	.actions {
		display: flex;
		align-items: center;
		gap: $unit;

		:global([data-button-root]) {
			margin-left: auto;
		}
	}

	.collapsed-rateups {
		display: flex;
		flex-wrap: wrap;
		gap: $unit-half;
		min-width: 0;
		margin: 0;
		padding: 0;
		list-style: none;

		img {
			display: block;
			width: $unit-5x;
			height: $unit-5x;
			border-radius: $item-corner-small;
			object-fit: cover;

			// 25% larger on desktop
			@media (min-width: 769px) {
				width: 50px;
				height: 50px;
			}
		}
	}
</style>
