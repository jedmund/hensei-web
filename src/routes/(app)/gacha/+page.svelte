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
	import { untrack } from 'svelte'
	import { toast } from 'svelte-sonner'
	import { page } from '$app/state'
	import { replaceState } from '$app/navigation'
	import { readShare, writeShare, type GachaShare } from '$lib/utils/gachaShare'
	import { gachaItemName, gachaItemThumbnail } from '$lib/utils/gacha'
	import type { CatalogueItem, GachaResult } from '$lib/types/gacha'

	type Operation = 'draw' | 'until' | 'odds'
	type Currency = 'usd' | 'jpy' | 'crystals'

	// Settings start from the URL so shared links open as they were sent. The
	// target and rate-ups wait for the catalogue, which resolves their ids.
	const shared = readShare(page.url.searchParams)
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
				if (share?.seed) untrack(() => void run(false, share.seed))
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

	async function run(replay = false, seed = '') {
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
	// the shown result still matches them
	$effect(() => {
		if (!restored) return
		const settings = currentShare()
		const query = result && resultShare === settings ? currentShare(result.seed) : settings
		untrack(() => {
			if (page.url.search === (query ? `?${query}` : '')) return
			const href = `${page.url.pathname}${query ? `?${query}` : ''}`
			// Right after hydration the router may not accept history updates yet
			setTimeout(() => {
				try {
					replaceState(href, page.state)
				} catch {
					// The URL catches up on the next change
				}
			}, 0)
		})
	})

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

<PageMeta title={m.gacha_title()} description={m.gacha_notice()} />

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
		<GachaResults
			{result}
			{operation}
			{busy}
			bind:currency
			bind:art
			onCopyLink={copyLink}
			onReplay={() => void run(true)}
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
</style>
