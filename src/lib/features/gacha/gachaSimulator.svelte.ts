/**
 * State for the gacha simulator page: the form's settings, the pool's
 * catalogue, the shown result, the draw animation and the draw log, with the
 * address bar kept in step so a link opens as it was sent.
 *
 * Construct it while the page initialises: its effects and mount hooks
 * belong to the page.
 */

import type { Rateup } from '$lib/components/gacha/GachaRateups.svelte'
import { collectionAdapter } from '$lib/api/adapters/collection.adapter'
import * as m from '$lib/paraglide/messages'
import { getLocale } from '$lib/paraglide/runtime'
import { onMount, untrack } from 'svelte'
import { MediaQuery } from 'svelte/reactivity'
import { page } from '$app/state'
import { replaceState } from '$app/navigation'
import {
	CURRENT_BANNER,
	seasonalPool,
	type GachaOperation,
	type GachaShare
} from '$lib/utils/gachaShare'
import { addEntry, type GachaLogEntry } from '$lib/utils/gachaLog'
import type { CatalogueItem, GachaBanner, GachaResult } from '$lib/types/gacha'
import { fetchCatalogue, readJson, runSimulation } from './api'
import {
	drawAnimation,
	keepsLinkSettings,
	readAnimationPreference,
	writeAnimationPreference,
	type DrawAnimation
} from './animation'
import {
	addressQuery,
	initialShare,
	restoreSelection,
	resultLink,
	settingsQuery,
	type GachaSettings
} from './links'
import { loadLog, logEntry, storeLog } from './log'
import {
	SSR_RATES,
	bannerCountdownParts,
	bannerEndTime,
	bannerSeason,
	catalogueSettings,
	hasFixedRates,
	isClassic,
	onePurchase,
	simulationPayload
} from './pools'

type Currency = 'usd' | 'jpy' | 'crystals'

const percent = (value: number) =>
	new Intl.NumberFormat(getLocale(), { style: 'percent', maximumFractionDigits: 2 }).format(value)

export class GachaSimulator {
	// Settings start from the URL so shared links open as they were sent. The
	// target and rate-ups wait for the catalogue, which resolves their ids.
	readonly #shared: GachaShare = initialShare(page.url)
	#pendingShare: GachaShare | null = this.#shared
	restored = $state(false)

	operation = $state<GachaOperation>(this.#shared.operation)
	mode = $state(this.#shared.mode)
	season = $state(this.#shared.season)
	purchase = $state<GachaShare['purchase']>(this.#shared.purchase)
	draws = $state(this.#shared.draws)
	copies = $state(this.#shared.copies)
	comparison = $state<GachaShare['comparison']>(this.#shared.comparison)
	target = $state('')
	rateups = $state<Rateup[]>([])
	items = $state<CatalogueItem[]>([])
	// The current banner's details, with its rate-ups, and whether the API
	// has a banner at all
	banner = $state<GachaBanner | null>(null)
	bannerAvailable = $state(false)
	// A shared current-banner result's banner, until it has been replayed
	#pinnedBanner = this.#shared.banner
	result = $state<GachaResult | null>(null)
	busy = $state(false)
	loading = $state(true)
	failure = $state('')
	targetError = $state('')
	currency = $state<Currency>(getLocale() === 'ja' ? 'jpy' : 'usd')
	art = $state<'weapon' | 'character'>('character')
	#runController: AbortController | undefined
	// The settings a result was produced with; the link carries its seed only
	// while the settings still match
	resultShare = $state('')
	// The settings card's rate-ups fold away to a row of thumbnails, on their
	// own when a draw starts
	collapsed = $state(false)

	// Draw animation: remembered per viewer; see `keepsLinkSettings`
	readonly #reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)')
	playAnimation = $state(false)
	animation = $state<DrawAnimation | null>(null)
	// Draw Again draws again in the same dialog; the last result stays hidden
	// in between
	drawingAgain = $state(false)

	// The signed-in viewer's characters (granblue ids), for moons and new
	// characters. Signed out, or until it loads, only repeats within a draw
	// give moons.
	owned = $state.raw<ReadonlySet<string> | undefined>()
	// The viewer's summons (summon ids), for the new-summon opening
	ownedSummons = $state.raw<ReadonlySet<string> | undefined>()

	// Draw log: every Draw and Until result started here, newest first, saved
	// in this browser
	log = $state<GachaLogEntry[]>([])

	// The time left on the current banner, ticking each second while it's shown
	now = $state(Date.now())

	readonly classic = $derived(isClassic(this.mode))
	readonly fixedRates = $derived(hasFixedRates(this.mode))
	readonly bannerRateups = $derived(this.banner?.rateups ?? [])
	// The current banner's season, shown in the locked season field
	readonly bannerSeason = $derived(this.fixedRates ? bannerSeason(this.items) : '')
	readonly shownRateups = $derived(this.fixedRates ? this.bannerRateups : this.rateups)
	readonly bannerLeft = $derived(this.banner ? Date.parse(this.banner.ends_at) - this.now : 0)
	readonly bannerLive = $derived(!!this.banner?.live && this.bannerLeft > 0)
	readonly bannerEnds = $derived(this.banner ? bannerEndTime(this.banner.ends_at, getLocale()) : '')
	readonly bannerCountdown = $derived(
		m.gacha_banner_duration(bannerCountdownParts(this.bannerLeft))
	)
	readonly ssrs = $derived(this.items.filter((item) => item.rarity === 3))
	readonly drawsLocked = $derived(this.playAnimation && this.operation === 'draw')
	// Link to the shown result: the settings it came from plus its seed,
	// whatever the form says now
	readonly resultLink = $derived(this.result ? resultLink(this.resultShare, this.result) : '')
	readonly resultTarget = $derived(this.items.find((item) => item.identity === this.result?.target))

	readonly modeOptions = $derived([
		...(this.bannerAvailable || this.mode === CURRENT_BANNER
			? [
					{
						value: CURRENT_BANNER,
						label: m.gacha_current(),
						...(this.banner ? { suffix: percent(Number(this.banner.ssr_rate)) } : {})
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
		].map((option) => ({ ...option, suffix: percent(SSR_RATES[option.value] ?? 0.03) }))
	])
	readonly seasonOptions = $derived([
		{ value: '', label: m.gacha_none() },
		{ value: 'valentines', label: m.gacha_valentines() },
		{ value: 'summer', label: m.gacha_summer() },
		{ value: 'halloween', label: m.gacha_halloween() },
		{ value: 'holiday', label: m.gacha_holiday() },
		{ value: 'formal', label: m.gacha_formal() }
	])
	readonly purchaseOptions = $derived([
		{ value: 'ten' as const, label: m.gacha_ten() },
		{ value: 'singles' as const, label: m.gacha_singles() }
	])
	readonly comparisonOptions = $derived([
		{ value: 'at_least' as const, label: m.gacha_at_least() },
		{ value: 'exactly' as const, label: m.gacha_exactly() }
	])

	// Address bar updates are applied on a timer against the real address
	// bar, so one queued before the result arrives can't win over the newer one
	#wantedQuery = ''
	#syncScheduled = false

	constructor() {
		$effect(() => {
			if (!this.fixedRates || !this.banner) return
			this.now = Date.now()
			const timer = setInterval(() => (this.now = Date.now()), 1000)
			return () => clearInterval(timer)
		})

		$effect(() => this.#loadCatalogue())
		$effect(() => () => this.#runController?.abort())

		// Draws follows Purchase while locked
		$effect(() => {
			if (this.drawsLocked) this.draws = onePurchase(this.purchase)
		})

		onMount(() => {
			this.playAnimation =
				readAnimationPreference() && keepsLinkSettings(page.url.search, this.#shared)
		})
		onMount(() => this.#loadCollection())
		onMount(() => {
			this.log = loadLog()
		})

		// Keep the address bar in step with the settings, adding the seed while
		// the shown result still matches them
		$effect(() => {
			if (!this.restored) return
			this.#wantedQuery = addressQuery(this.#settingsQuery(), this.result, this.resultShare)
			if (!this.#syncScheduled) {
				this.#syncScheduled = true
				setTimeout(this.#syncUrl, 0)
			}
		})
	}

	get settings(): GachaSettings {
		return {
			operation: this.operation,
			mode: this.mode,
			season: this.season,
			purchase: this.purchase,
			draws: this.draws,
			copies: this.copies,
			comparison: this.comparison,
			target: this.target,
			rateups: this.rateups
		}
	}

	itemFor = (identity: string) => this.items.find((item) => item.identity === identity)

	run = async (seed = '') => {
		if (this.busy) return
		if (this.operation !== 'draw' && !this.target) {
			this.targetError = m.gacha_target_required()
			return
		}
		this.collapsed = true
		this.busy = true
		this.failure = ''
		this.#runController = new AbortController()
		const signal = this.#runController.signal
		const payload = simulationPayload(this.settings, seed, this.#pinnedBanner)
		try {
			const data = await runSimulation(this.operation, payload, signal)
			this.result = data
			this.resultShare = this.#settingsQuery()
			const operation = this.operation
			// Draws started here go in the log; shared links replaying a result don't
			if (!seed && operation !== 'odds') {
				const link = resultLink(this.resultShare, data)
				this.#saveLog(addEntry(this.log, logEntry(operation, data, link, this.items, this.owned)))
			}
			// Only for draws started here, not shared links replaying a result
			if (!seed && operation === 'draw' && this.playAnimation && !this.#reducedMotion.current) {
				const next = drawAnimation(data.ordered ?? [], data.seed, this.owned, this.ownedSummons)
				if (next) this.animation = next
			}
		} catch (error) {
			if (!signal.aborted) this.failure = error instanceof Error ? error.message : m.gacha_error()
		} finally {
			this.busy = false
		}
	}

	// If the draw doesn't bring a new animation (it failed), the dialog closes
	drawAgain = () => {
		const shown = this.animation
		this.drawingAgain = true
		this.run().finally(() => {
			this.drawingAgain = false
			if (this.animation === shown) this.animation = null
		})
	}

	closeAnimation = () => {
		this.animation = null
	}

	setPlayAnimation = (value: boolean) => {
		if (value === this.playAnimation) return
		this.playAnimation = value
		writeAnimationPreference(value)
	}

	selectOperation = (value: string) => {
		this.operation = value as GachaOperation
		this.targetError = ''
		this.result = null
	}

	clearLog = () => this.#saveLog([])

	#saveLog(entries: GachaLogEntry[]) {
		this.log = storeLog(entries)
	}

	#settingsQuery() {
		return settingsQuery(this.settings, this.items)
	}

	#loadCatalogue() {
		const settings = catalogueSettings(
			this.mode,
			this.classic || this.fixedRates ? '' : this.season
		)
		const controller = new AbortController()
		this.loading = true
		this.failure = ''
		fetchCatalogue(
			settings,
			this.fixedRates ? untrack(() => this.#pinnedBanner) : '',
			controller.signal,
			// A shared banner we no longer have: the result can't replay, so
			// the page opens on the live banner
			() => (this.#pinnedBanner = '')
		)
			.then(async (response) => {
				// No banner yet: the pool that's likely running today instead
				if (response.status === 422 && this.fixedRates) {
					this.mode = seasonalPool()
					return
				}
				const data = await readJson(response)
				this.items = data.items
				this.banner = data.banner ?? null
				this.bannerAvailable = data.modes?.includes(CURRENT_BANNER) ?? false
				this.result = null
				const share = this.#pendingShare
				this.#pendingShare = null
				const { target, rateups } = restoreSelection(share, this.items)
				this.target = target
				this.rateups = rateups
				this.restored = true
				if (share?.seed) untrack(() => void this.run(share.seed))
				// Only the shared result replays its banner; later draws use the live one
				this.#pinnedBanner = ''
			})
			.catch((error) => {
				if (!controller.signal.aborted) this.failure = String(error.message)
			})
			.finally(() => {
				if (!controller.signal.aborted) this.loading = false
			})
		return () => controller.abort()
	}

	// The sets are replaced whole, never changed, so they needn't be reactive
	/* eslint-disable svelte/prefer-svelte-reactivity */
	#loadCollection() {
		const userId = page.data.account?.userId
		if (!userId) return
		collectionAdapter
			.getCollectedCharacterGranblueIds(userId)
			.then((ids) => (this.owned = new Set(ids)))
			.catch(() => {
				// Draws still work, just without the collection
			})
		collectionAdapter
			.getCollectedSummonIds(userId)
			.then((ids) => (this.ownedSummons = new Set(ids)))
			.catch(() => {
				// Draws still work, just without the new-summon opening
			})
	}
	/* eslint-enable svelte/prefer-svelte-reactivity */

	#syncUrl = () => {
		this.#syncScheduled = false
		const search = this.#wantedQuery ? `?${this.#wantedQuery}` : ''
		if (window.location.search === search) return
		try {
			replaceState(`${window.location.pathname}${search}`, page.state)
		} catch {
			// Right after hydration the router may not accept history updates yet
			this.#syncScheduled = true
			setTimeout(this.#syncUrl, 50)
		}
	}
}
