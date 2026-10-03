/**
 * Gacha simulator settings in the URL, so a configuration (and, with a seed,
 * a result) can be shared as a link.
 *
 * Items are referenced by granblue_id to keep links short; the page resolves
 * them against the loaded catalogue. Every value is validated on the way in
 * and anything invalid is dropped, so a hand-edited link can never send raw
 * strings to the API.
 */

export type GachaOperation = 'draw' | 'until' | 'odds'

export interface GachaShare {
	operation: GachaOperation
	mode: string
	season: string
	purchase: 'ten' | 'singles'
	draws: string
	copies: string
	comparison: 'at_least' | 'exactly'
	/** granblue_id of the Until/Odds target */
	target: string
	/** granblue_id and percentage of each rate-up */
	rateups: { id: string; percent: string }[]
	seed: string
}

export const GACHA_MODES = ['premium', 'legend', 'flash', 'classic', 'classic_ii', 'classic_iii']
export const GACHA_SEASONS = ['valentines', 'summer', 'halloween', 'holiday', 'formal']

export const SHARE_DEFAULTS: GachaShare = {
	operation: 'draw',
	mode: 'premium',
	season: '',
	purchase: 'ten',
	draws: '300',
	copies: '1',
	comparison: 'at_least',
	target: '',
	rateups: [],
	seed: ''
}

const MAX_RATEUPS = 50
const GRANBLUE_ID = /^\d{10}$/
const PERCENT = /^\d{1,3}(\.\d{1,6})?$/

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
	return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

/** Digits only, within 1..max; otherwise the fallback */
function count(value: string | null, max: number, fallback: string): string {
	if (!value || !/^\d{1,13}$/.test(value)) return fallback
	const number = Number(value)
	return number >= 1 && number <= max ? String(number) : fallback
}

function seed(value: string | null): string {
	// eslint-disable-next-line no-control-regex
	return (value ?? '').replace(/[\x00-\x1f\x7f]/g, '').slice(0, 128)
}

/**
 * The pool that's most likely running on a given day, by the day of the month
 * in Japan time: Legend Festival at the turn of the month (28th to 4th), Flash
 * Gala mid-month (15th to 20th), Premium otherwise.
 */
export function seasonalPool(date: Date = new Date()): string {
	const day = Number(
		new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', day: 'numeric' }).format(date)
	)
	if (day >= 28 || day <= 4) return 'legend'
	if (day >= 15 && day <= 20) return 'flash'
	return 'premium'
}

export function readShare(params: URLSearchParams): GachaShare {
	const operation = oneOf(params.get('op'), ['draw', 'until', 'odds'], SHARE_DEFAULTS.operation)
	const mode = oneOf(params.get('pool'), GACHA_MODES, SHARE_DEFAULTS.mode)
	const season = mode.startsWith('classic') ? '' : oneOf(params.get('season'), GACHA_SEASONS, '')
	const target = params.get('target') ?? ''

	const rateups: GachaShare['rateups'] = []
	for (const entry of params.getAll('rateup').slice(0, MAX_RATEUPS)) {
		const [id = '', percent = ''] = entry.split(':')
		if (GRANBLUE_ID.test(id) && PERCENT.test(percent) && !rateups.some((rate) => rate.id === id)) {
			rateups.push({ id, percent })
		}
	}

	return {
		operation,
		mode,
		season,
		purchase: oneOf(params.get('purchase'), ['ten', 'singles'], SHARE_DEFAULTS.purchase),
		draws: count(params.get('draws'), operation === 'odds' ? 1e12 : 1e6, SHARE_DEFAULTS.draws),
		copies: count(params.get('copies'), 1000, SHARE_DEFAULTS.copies),
		comparison: oneOf(params.get('cmp'), ['at_least', 'exactly'], SHARE_DEFAULTS.comparison),
		target: GRANBLUE_ID.test(target) ? target : '',
		rateups,
		seed: seed(params.get('seed'))
	}
}

/** Query string for a share, leaving out values that match the defaults */
export function writeShare(share: GachaShare): string {
	const params = new URLSearchParams()
	if (share.operation !== SHARE_DEFAULTS.operation) params.set('op', share.operation)
	if (share.mode !== SHARE_DEFAULTS.mode) params.set('pool', share.mode)
	if (share.season) params.set('season', share.season)
	if (share.purchase !== SHARE_DEFAULTS.purchase) params.set('purchase', share.purchase)
	if (share.operation !== 'until' && share.draws !== SHARE_DEFAULTS.draws) {
		params.set('draws', share.draws)
	}
	if (share.operation !== 'draw') {
		if (share.copies !== SHARE_DEFAULTS.copies) params.set('copies', share.copies)
		if (share.target) params.set('target', share.target)
	}
	if (share.operation === 'odds' && share.comparison !== SHARE_DEFAULTS.comparison) {
		params.set('cmp', share.comparison)
	}
	for (const rate of share.rateups) params.append('rateup', `${rate.id}:${rate.percent}`)
	if (share.seed) params.set('seed', share.seed)
	return params.toString()
}
