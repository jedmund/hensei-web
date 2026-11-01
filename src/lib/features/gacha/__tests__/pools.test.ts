import { describe, it, expect } from 'vitest'
import {
	bannerCountdownParts,
	bannerEndTime,
	bannerSeason,
	catalogueSettings,
	hasFixedRates,
	isClassic,
	onePurchase,
	simulationPayload
} from '../pools'
import type { GachaSettings } from '../links'
import { Promotion } from '$lib/types/enums'
import type { CatalogueItem } from '$lib/types/gacha'

const item = (promotions: number[]) => ({ promotions }) as CatalogueItem

const settings = (overrides: Partial<GachaSettings> = {}): GachaSettings => ({
	operation: 'draw',
	mode: 'premium',
	season: 'summer',
	purchase: 'ten',
	draws: '300',
	copies: '2',
	comparison: 'at_least',
	target: '',
	rateups: [{ identity: 'Weapon:1', percent: '0.5' }],
	...overrides
})

describe('pool kinds', () => {
	it('knows the classic pools and the current banner', () => {
		expect(['classic', 'classic_ii', 'classic_iii'].every(isClassic)).toBe(true)
		expect(isClassic('premium')).toBe(false)
		expect(hasFixedRates('current')).toBe(true)
		expect(hasFixedRates('legend')).toBe(false)
	})

	it('locks draws to one purchase', () => {
		expect(onePurchase('ten')).toBe('10')
		expect(onePurchase('singles')).toBe('1')
	})
})

describe('bannerSeason', () => {
	it('is the season with the most limited items', () => {
		const items = [
			item([Promotion.Summer]),
			item([Promotion.Halloween]),
			item([Promotion.Halloween]),
			item([Promotion.Premium, Promotion.Summer]),
			item([Promotion.Premium, Promotion.Summer])
		]
		expect(bannerSeason(items)).toBe('halloween')
	})

	it('ignores items that are also in Premium', () => {
		expect(bannerSeason([item([Promotion.Premium, Promotion.Holiday])])).toBe('')
	})
})

describe('catalogueSettings', () => {
	it('asks for a season only where the pool takes one', () => {
		expect(catalogueSettings('legend', 'summer')).toEqual({ mode: 'legend', season: 'summer' })
		expect(catalogueSettings('legend', '')).toEqual({ mode: 'legend' })
		expect(catalogueSettings('classic_ii', 'summer')).toEqual({ mode: 'classic_ii' })
		expect(catalogueSettings('current', 'summer')).toEqual({ mode: 'current' })
	})
})

describe('simulationPayload', () => {
	it('sends the form’s settings', () => {
		expect(simulationPayload(settings())).toEqual({
			mode: 'premium',
			season: 'summer',
			purchase: 'ten',
			draws: '300',
			copies: 2,
			comparison: 'at_least',
			target: '',
			rateups: [{ identity: 'Weapon:1', percent: '0.5' }]
		})
	})

	it('sends no season for classic pools, and none when unset', () => {
		expect(simulationPayload(settings({ mode: 'classic' })).season).toBeNull()
		expect(simulationPayload(settings({ season: '' })).season).toBeNull()
	})

	it('sends the current banner without seasons or custom rate-ups', () => {
		const payload = simulationPayload(settings({ mode: 'current' }))
		expect(payload.season).toBeNull()
		expect(payload.rateups).toEqual([])
	})

	it('replays a seed, naming the pinned banner only for the current banner', () => {
		expect(simulationPayload(settings({ mode: 'current' }), 'abc', '211960')).toMatchObject({
			seed: 'abc',
			banner: '211960'
		})
		expect(simulationPayload(settings(), 'abc', '211960')).not.toHaveProperty('banner')
		expect(simulationPayload(settings({ mode: 'current' }), '', '211960')).not.toHaveProperty(
			'banner'
		)
		expect(simulationPayload(settings())).not.toHaveProperty('seed')
	})
})

describe('banner time', () => {
	it('splits the time left into days, hours and minutes', () => {
		const left = ((2 * 24 + 3) * 60 + 7) * 60_000 + 59_000
		expect(bannerCountdownParts(left)).toEqual({ days: '2', hours: '03', minutes: '07' })
	})

	it('stops at zero', () => {
		expect(bannerCountdownParts(-5000)).toEqual({ days: '0', hours: '00', minutes: '00' })
	})

	it('shows the banner’s last minute in Japan time', () => {
		// 19:00 JST ends at 18:59
		expect(bannerEndTime('2026-10-31T10:00:00Z', 'en-US')).toMatch(/^Oct 31, 6:59\sPM$/)
	})
})
