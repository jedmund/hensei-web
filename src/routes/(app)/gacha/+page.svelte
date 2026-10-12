<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import GachaItemPicker from '$lib/components/gacha/GachaItemPicker.svelte'
	import GachaRateups, { type Rateup } from '$lib/components/gacha/GachaRateups.svelte'
	import GachaResults from '$lib/components/gacha/GachaResults.svelte'
	import GachaAnimation from '$lib/components/gacha/GachaAnimation.svelte'
	import GachaLog from '$lib/components/gacha/GachaLog.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import { choosePresentation, type Presentation } from '$lib/gacha-animation/presentation'
	import { drawMoons, goldMoonCount, type Moon } from '$lib/gacha-animation/moons'
	import { collectionAdapter } from '$lib/api/adapters/collection.adapter'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { onMount, untrack } from 'svelte'
	import { slide } from 'svelte/transition'
	import { MediaQuery } from 'svelte/reactivity'
	import { page } from '$app/state'
	import { replaceState } from '$app/navigation'
	import {
		CURRENT_BANNER,
		readShare,
		seasonalPool,
		writeShare,
		type GachaShare
	} from '$lib/utils/gachaShare'
	import {
		gachaGranblueIdFor,
		gachaIdentityFor,
		gachaItemName,
		gachaItemThumbnail
	} from '$lib/utils/gacha'
	import { addEntry, readLog, trimResult, writeLog, type GachaLogEntry } from '$lib/utils/gachaLog'
	import type { CatalogueItem, GachaBanner, GachaResult } from '$lib/types/gacha'
	import { Promotion } from '$lib/types/enums'

	let { data } = $props()

	type Operation = 'draw' | 'until' | 'odds'
	type Currency = 'usd' | 'jpy' | 'crystals'

	// Settings start from the URL so shared links open as they were sent. The
	// target and rate-ups wait for the catalogue, which resolves their ids.
	// A fresh visit opens on the game's current banner (or, until the API has
	// one, the pool that's likely running today); links with settings keep
	// theirs, since they leave Premium out of the query
	const shared = page.url.search
		? readShare(page.url.searchParams)
		: { ...readShare(page.url.searchParams), mode: CURRENT_BANNER }
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
	let rateups = $state<Rateup[]>([])
	let items = $state<CatalogueItem[]>([])
	// The current banner's details, with its rate-ups, and whether the API
	// has a banner at all
	let banner = $state<GachaBanner | null>(null)
	let bannerAvailable = $state(false)
	// A shared current-banner result's banner, until it has been replayed
	let pinnedBanner = shared.banner
	let result = $state<GachaResult | null>(null)
	let busy = $state(false)
	let loading = $state(true)
	let failure = $state('')
	let targetError = $state('')
	let currency = $state<Currency>(getLocale() === 'ja' ? 'jpy' : 'usd')
	let art = $state<'weapon' | 'character'>('character')
	let runController: AbortController | undefined
	// The settings a result was produced with; the link carries its seed only
	// while the settings still match
	let resultShare = $state('')
	// Link to the shown result: the settings it came from plus its seed,
	// whatever the form says now
	const resultLink = $derived(result ? linkFor(resultShare, result) : '')
	/** A result's link: its settings, its seed and, for the current banner, the banner it came from */
	function linkFor(settings: string, data: GachaResult) {
		const { mode: pool, banner: pin } = data.configuration ?? {}
		return [
			settings,
			`seed=${encodeURIComponent(data.seed)}`,
			pool === CURRENT_BANNER && pin ? `banner=${encodeURIComponent(pin)}` : ''
		]
			.filter(Boolean)
			.join('&')
	}

	// Base SSR rates, matching the API's simulation: 6% for the galas, 3% otherwise
	const ssrRates: Record<string, number> = {
		premium: 0.03,
		legend: 0.06,
		flash: 0.06,
		classic: 0.03,
		classic_ii: 0.03,
		classic_iii: 0.03
	}
	const percent = (value: number) =>
		new Intl.NumberFormat(getLocale(), { style: 'percent', maximumFractionDigits: 2 }).format(value)
	const modeOptions = $derived([
		...(bannerAvailable || mode === CURRENT_BANNER
			? [
					{
						value: CURRENT_BANNER,
						label: m.gacha_current(),
						...(banner ? { suffix: percent(Number(banner.ssr_rate)) } : {})
					}
				]
			: []),
		...[
			{ value: 'premium', label: m.gacha_premium() },
			{ value: 'legend', label: m.gacha_legend() },
			{ value: 'flash', label: m.gacha_flash() },
			{ value: 'classic', label: m.gacha_classic() },
			{ value: 'classic_ii', label: m.gacha_classic_ii() },
			{ value: 'classic_iii', label: m.gacha_classic_iii() }
		].map((option) => ({ ...option, suffix: percent(ssrRates[option.value] ?? 0.03) }))
	])
	// Each season's draw, as the catalogue's promotion numbers
	const SEASON_PROMOTIONS: [string, Promotion][] = [
		['valentines', Promotion.Valentine],
		['summer', Promotion.Summer],
		['halloween', Promotion.Halloween],
		['holiday', Promotion.Holiday],
		['formal', Promotion.Formal]
	]
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
	// The current banner's rates come from the game: no seasons or custom rate-ups
	const fixedRates = $derived(mode === CURRENT_BANNER)
	const bannerRateups = $derived(banner?.rateups ?? [])
	// The current banner's season, shown in the locked season field: the one
	// whose limited items (in that season's draws but not Premium) it has most of
	const bannerSeason = $derived.by(() => {
		if (!fixedRates) return ''
		const counts: Record<string, number> = {}
		for (const item of items) {
			if (item.promotions.includes(Promotion.Premium)) continue
			for (const [value, promotion] of SEASON_PROMOTIONS) {
				if (item.promotions.includes(promotion)) counts[value] = (counts[value] ?? 0) + 1
			}
		}
		return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
	})
	const shownRateups = $derived(fixedRates ? bannerRateups : rateups)
	// The time left on the current banner, ticking each second while it's shown
	let now = $state(Date.now())
	$effect(() => {
		if (!fixedRates || !banner) return
		now = Date.now()
		const timer = setInterval(() => (now = Date.now()), 1000)
		return () => clearInterval(timer)
	})
	const bannerLeft = $derived(banner ? new Date(banner.ends_at).getTime() - now : 0)
	const bannerLive = $derived(!!banner?.live && bannerLeft > 0)
	// The banner's last minute, in the game's own time
	const bannerEnds = $derived(
		banner
			? new Intl.DateTimeFormat(getLocale(), {
					timeZone: 'Asia/Tokyo',
					month: 'short',
					day: 'numeric',
					hour: 'numeric',
					minute: '2-digit'
				}).format(new Date(new Date(banner.ends_at).getTime() - 60_000))
			: ''
	)
	const bannerCountdown = $derived.by(() => {
		const minutes = Math.max(0, Math.floor(bannerLeft / 60_000))
		const pad = (value: number) => String(value).padStart(2, '0')
		return m.gacha_banner_duration({
			days: String(Math.floor(minutes / 1440)),
			hours: pad(Math.floor(minutes / 60) % 24),
			minutes: pad(minutes % 60)
		})
	})
	const ssrs = $derived(items.filter((item) => item.rarity === 3))

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
		const settings: Record<string, string> = { mode }
		if (!classic && !fixedRates && season) settings.season = season
		const controller = new AbortController()
		const load = (pinned: string): Promise<Response> => {
			const query = new URLSearchParams(pinned ? { ...settings, banner: pinned } : settings)
			return fetch(`/api/gacha/catalogue?${query}`, { signal: controller.signal }).then(
				(response) => {
					// A shared banner we no longer have: the result can't replay,
					// so the page opens on the live banner
					if (response.status !== 422 || !pinned) return response
					pinnedBanner = ''
					return load('')
				}
			)
		}
		loading = true
		failure = ''
		load(fixedRates ? untrack(() => pinnedBanner) : '')
			.then(async (response) => {
				// No banner yet: the pool that's likely running today instead
				if (response.status === 422 && fixedRates) {
					mode = seasonalPool()
					return
				}
				const data = await readJson(response)
				items = data.items
				banner = data.banner ?? null
				bannerAvailable = data.modes?.includes(CURRENT_BANNER) ?? false
				result = null
				const share = pendingShare
				pendingShare = null
				target = share ? gachaIdentityFor(items, share.target) : ''
				rateups = share
					? share.rateups.flatMap(({ id, percent }) => {
							const identity = gachaIdentityFor(items, id, 3)
							return identity ? [{ identity, percent }] : []
						})
					: []
				restored = true
				if (share?.seed) untrack(() => void run(share.seed))
				// Only the shared result replays its banner; later draws use the live one
				pinnedBanner = ''
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

	// Draw animation: when the switch is on, Draw is locked to one purchase (a
	// 10-draw or a single draw) and plays the animation before the results.
	// Remembered per viewer; a shared link with other settings keeps its
	// settings and turns the switch off for that visit.
	const ANIMATION_KEY = 'gacha:playAnimation'
	const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)')
	let playAnimation = $state(false)
	let animation = $state<{
		items: CatalogueItem[]
		presentation: Presentation
		moons: Moon[]
		newCharacters: ReadonlySet<string>
	} | null>(null)
	// Draw Again draws again in the same dialog; the last result stays hidden
	// in between. If the draw doesn't bring a new animation (it failed), the
	// dialog closes.
	let drawingAgain = $state(false)
	function drawAgain() {
		const shown = animation
		drawingAgain = true
		run().finally(() => {
			drawingAgain = false
			if (animation === shown) animation = null
		})
	}
	const drawsLocked = $derived(playAnimation && operation === 'draw')

	const onePurchase = (unit: 'ten' | 'singles') => (unit === 'ten' ? '10' : '1')
	// Draws follows Purchase while locked
	$effect(() => {
		if (drawsLocked) draws = onePurchase(purchase)
	})
	function setPlayAnimation(value: boolean) {
		if (value === playAnimation) return
		playAnimation = value
		try {
			localStorage.setItem(ANIMATION_KEY, value ? '1' : '0')
		} catch {
			// Storage can be unavailable (private mode); the switch still works
		}
	}
	onMount(() => {
		let remembered = false
		try {
			remembered = localStorage.getItem(ANIMATION_KEY) === '1'
		} catch {
			remembered = false
		}
		const keepsSettings = !page.url.search || String(shared.draws) === onePurchase(shared.purchase)
		playAnimation = remembered && keepsSettings
	})

	// The signed-in viewer's characters (granblue ids), for moons and new
	// characters. Signed out, or until it loads, only repeats within a draw
	// give moons.
	let owned = $state.raw<ReadonlySet<string> | undefined>()
	// The viewer's summons (summon ids), for the new-summon opening
	let ownedSummons = $state.raw<ReadonlySet<string> | undefined>()
	onMount(() => {
		const userId = page.data.account?.userId
		if (!userId) return
		collectionAdapter
			.getCollectedCharacterGranblueIds(userId)
			.then((ids) => (owned = new Set(ids)))
			.catch(() => {
				// Draws still work, just without the collection
			})
		collectionAdapter
			.getCollectedSummonIds(userId)
			.then((ids) => (ownedSummons = new Set(ids)))
			.catch(() => {
				// Draws still work, just without the new-summon opening
			})
	})

	// Draw log: every Draw and Until result started here, newest first, saved
	// in this browser
	let log = $state<GachaLogEntry[]>([])
	function saveLog(entries: GachaLogEntry[]) {
		try {
			log = writeLog(localStorage, entries)
		} catch {
			// No storage at all; keep the log for this visit
			log = entries
		}
	}
	onMount(() => {
		try {
			log = readLog(localStorage)
		} catch {
			log = []
		}
	})

	// The settings card's rate-ups fold away to a row of thumbnails, on their
	// own when a draw starts
	const isMobile = new MediaQuery('(max-width: 768px)')
	let collapsed = $state(false)

	async function run(seed = '') {
		if (busy) return
		if (operation !== 'draw' && !target) {
			targetError = m.gacha_target_required()
			return
		}
		collapsed = true
		busy = true
		failure = ''
		runController = new AbortController()
		const signal = runController.signal
		const payload = {
			mode,
			season: classic || fixedRates ? null : season || null,
			purchase,
			draws,
			copies: Number(copies),
			comparison,
			target,
			rateups: fixedRates ? [] : rateups,
			...(seed ? { seed } : {}),
			...(seed && fixedRates && pinnedBanner ? { banner: pinnedBanner } : {})
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
			// Draws started here go in the log; shared links replaying a result don't
			if (!seed && operation !== 'odds') {
				saveLog(
					addEntry(log, {
						id: data.seed,
						at: Date.now(),
						operation,
						link: linkFor(resultShare, data),
						result: trimResult(data),
						target: items.find((item) => item.identity === data.target),
						goldMoons: goldMoonCount(data.items ?? [], owned)
					})
				)
			}
			// Only for draws started here, not shared links replaying a result
			if (!seed && operation === 'draw' && playAnimation && !reducedMotion.current) {
				const drawn: CatalogueItem[] = data.ordered ?? []
				if (drawn.length > 0) {
					const { moons, newCharacters } = drawMoons(drawn, owned)
					const newSummons = new Set(
						ownedSummons
							? drawn
									.filter(
										(item) =>
											item.drawable_type === 'Summon' && !ownedSummons?.has(item.drawable_id)
									)
									.map((item) => item.identity)
							: []
					)
					animation = {
						items: drawn,
						presentation: choosePresentation(drawn, data.seed, { newCharacters, newSummons }),
						moons,
						newCharacters
					}
				}
			}
		} catch (error) {
			if (!signal.aborted) failure = error instanceof Error ? error.message : m.gacha_error()
		} finally {
			busy = false
		}
	}

	function currentShare() {
		return writeShare({
			operation,
			mode,
			season: classic || fixedRates ? '' : season,
			purchase,
			draws: String(draws),
			copies: String(copies),
			comparison,
			target: gachaGranblueIdFor(items, target),
			rateups: fixedRates
				? []
				: rateups.flatMap((rate) => {
						const id = gachaGranblueIdFor(items, rate.identity)
						return id ? [{ id, percent: String(rate.percent) }] : []
					}),
			seed: '',
			banner: ''
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
		wantedQuery = result && resultShare === settings ? linkFor(settings, result) : settings
		if (!syncScheduled) {
			syncScheduled = true
			setTimeout(syncUrl, 0)
		}
	})

	function selectOperation(value: string) {
		operation = value as Operation
		targetError = ''
		result = null
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
				aria-label={collapsed ? m.gacha_show_rateups() : m.gacha_hide_rateups()}
				aria-expanded={!collapsed}
				aria-controls="gacha-rateups"
				type="button"
				onclick={() => (collapsed = !collapsed)}
			/>
		</div>
		<div class="settings">
			<div class="fields">
				<Select
					contained
					label={m.gacha_mode()}
					options={modeOptions}
					bind:value={mode}
					fullWidth
				/>
				<!-- Classic pools have no seasons, and the current banner shows its own; the choice is kept for other pools -->
				<Select
					contained
					label={m.gacha_season()}
					options={seasonOptions}
					value={classic ? '' : fixedRates ? bannerSeason : season}
					onValueChange={(value) => (season = value ?? '')}
					disabled={classic || fixedRates}
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
						disabled={drawsLocked}
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

			{#if !collapsed}
				<div id="gacha-rateups" transition:slide={{ duration: 150 }}>
					{#if fixedRates}
						<GachaRateups {ssrs} rateups={bannerRateups} readonly>
							{#snippet aside()}
								{#if bannerLive}
									<Tooltip content={m.gacha_banner_ends({ date: bannerEnds })}>
										<span class="banner-countdown">
											{m.gacha_banner_remaining({ time: bannerCountdown })}
										</span>
									</Tooltip>
								{:else if banner}
									<!-- Until the new banner's rates arrive, the last banner's stand in -->
									<span class="banner-countdown">{m.gacha_banner_expired()}</span>
								{/if}
							{/snippet}
						</GachaRateups>
					{:else}
						<GachaRateups {ssrs} bind:rateups disabled={loading} />
					{/if}
				</div>
			{/if}
		</div>

		{#if failure}
			<p class="failure" role="alert">{failure}</p>
		{/if}

		<div class="actions">
			{#if collapsed && shownRateups.length > 0}
				<ul class="collapsed-rateups" aria-label={m.gacha_rates()}>
					{#each shownRateups as rate (rate.identity)}
						{@const item = itemFor(rate.identity)}
						{#if item}
							<li title="{name(item)} {rate.percent}%">
								<img src={gachaItemThumbnail(item)} alt={name(item)} />
							</li>
						{/if}
					{/each}
				</ul>
			{/if}
			<div class="run">
				{#if operation === 'draw'}
					<label class="animation-toggle">
						<Switch
							checked={playAnimation}
							size="small"
							disabled={busy}
							onCheckedChange={setPlayAnimation}
						/>
						<span>{m.gacha_play_animation()}</span>
					</label>
				{/if}
				<Button variant="primary" type="submit" disabled={loading || busy}>
					{m.gacha_run()}
				</Button>
			</div>
		</div>
	</form>

	{#if animation}
		<GachaAnimation
			items={animation.items}
			presentation={animation.presentation}
			moons={animation.moons}
			newCharacters={animation.newCharacters}
			onDone={() => (animation = null)}
			onDrawAgain={drawAgain}
		/>
	{/if}

	<!-- Held back while the animation plays, so they don't give it away -->
	{#if result && !animation && !drawingAgain}
		<GachaResults
			{result}
			heading={m.gacha_latest_result()}
			target={items.find((item) => item.identity === result?.target)}
			{operation}
			bind:currency
			bind:art
			link={resultLink}
		/>
	{/if}

	{#if log.length > 0 && !animation && !drawingAgain}
		<GachaLog entries={log} bind:currency bind:art onClear={() => saveLog([])} />
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

	.banner-countdown {
		color: var(--text-secondary);
		font-size: $font-small;
		font-variant-numeric: tabular-nums;
	}

	.failure {
		margin: 0;
		color: $error;
		font-size: $font-small;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: $unit;
	}

	// Keeps its size; the rate-up thumbnails wrap to make room, and on a narrow
	// screen it moves below them
	.run {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: $unit-2x;
		margin-left: auto;
	}

	.animation-toggle {
		display: flex;
		align-items: center;
		gap: $unit;
		font-size: $font-small;
		color: var(--text-secondary);
		white-space: nowrap;
		cursor: pointer;
	}

	.collapsed-rateups {
		display: flex;
		// At least three thumbnails wide
		flex: 1 1 calc($unit-5x * 3 + $unit-half * 2);
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
