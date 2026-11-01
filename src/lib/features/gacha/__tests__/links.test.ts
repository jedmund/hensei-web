import { describe, it, expect } from 'vitest'
import {
	addressQuery,
	initialShare,
	restoreSelection,
	resultLink,
	settingsQuery,
	type GachaSettings
} from '../links'
import { readShare, SHARE_DEFAULTS } from '$lib/utils/gachaShare'
import type { CatalogueItem, GachaResult } from '$lib/types/gacha'

const item = (identity: string, granblue_id: string, rarity = 3) =>
	({ identity, granblue_id, rarity }) as CatalogueItem

const items = [
	item('Weapon:1', '1040918400'),
	item('Weapon:2', '1040119000'),
	item('Summon:3', '2040094000'),
	item('Weapon:4', '1040000000', 2)
]

const settings = (overrides: Partial<GachaSettings> = {}): GachaSettings => ({
	operation: 'draw',
	mode: 'premium',
	season: '',
	purchase: 'ten',
	draws: '300',
	copies: '1',
	comparison: 'at_least',
	target: '',
	rateups: [],
	...overrides
})

const result = (seed: string, configuration: GachaResult['configuration']) =>
	({ seed, configuration }) as GachaResult

describe('initialShare', () => {
	it('opens a fresh visit on the current banner', () => {
		expect(initialShare(new URL('https://granblue.team/gacha')).mode).toBe('current')
	})

	it('keeps a link’s settings, which leave Premium out', () => {
		expect(initialShare(new URL('https://granblue.team/gacha?draws=10')).mode).toBe('premium')
		expect(initialShare(new URL('https://granblue.team/gacha?pool=legend')).mode).toBe('legend')
	})
})

describe('resultLink', () => {
	it('adds the seed to the settings', () => {
		expect(resultLink('pool=legend', result('a b', { mode: 'legend' }))).toBe(
			'pool=legend&seed=a%20b'
		)
	})

	it('pins a current-banner result to its banner', () => {
		expect(resultLink('pool=current', result('abc', { mode: 'current', banner: '211960' }))).toBe(
			'pool=current&seed=abc&banner=211960'
		)
	})

	it('leaves the banner out for other pools', () => {
		expect(resultLink('', result('abc', { mode: 'premium', banner: '211960' }))).toBe('seed=abc')
	})
})

describe('settingsQuery', () => {
	it('writes nothing for the defaults', () => {
		expect(settingsQuery(settings(), items)).toBe('')
	})

	it('writes items as granblue ids and numbers as strings', () => {
		const query = settingsQuery(
			settings({
				operation: 'until',
				copies: 3,
				target: 'Weapon:1',
				rateups: [{ identity: 'Weapon:2', percent: '0.5' }]
			}),
			items
		)
		expect(readShare(new URLSearchParams(query))).toMatchObject({
			operation: 'until',
			copies: '3',
			target: '1040918400',
			rateups: [{ id: '1040119000', percent: '0.5' }]
		})
	})

	it('drops items missing from the catalogue', () => {
		const query = settingsQuery(
			settings({ rateups: [{ identity: 'Weapon:9', percent: '1' }] }),
			items
		)
		expect(query).toBe('')
	})

	it('drops seasons for classic pools and the current banner', () => {
		expect(settingsQuery(settings({ mode: 'legend', season: 'summer' }), items)).toBe(
			'pool=legend&season=summer'
		)
		expect(settingsQuery(settings({ mode: 'classic', season: 'summer' }), items)).toBe(
			'pool=classic'
		)
		expect(settingsQuery(settings({ mode: 'current', season: 'summer' }), items)).toBe(
			'pool=current'
		)
	})

	it('drops custom rate-ups for the current banner', () => {
		const rateups = [{ identity: 'Weapon:2', percent: '0.5' }]
		expect(settingsQuery(settings({ mode: 'current', rateups }), items)).toBe('pool=current')
	})

	it('round-trips through the share reader', () => {
		const form = settings({
			operation: 'odds',
			mode: 'flash',
			season: 'holiday',
			purchase: 'singles',
			draws: 1500,
			copies: '2',
			comparison: 'exactly',
			target: 'Weapon:1',
			rateups: [{ identity: 'Summon:3', percent: '1' }]
		})
		const share = readShare(new URLSearchParams(settingsQuery(form, items)))
		expect(restoreSelection(share, items)).toEqual({
			target: form.target,
			rateups: form.rateups
		})
		expect(share).toMatchObject({ mode: 'flash', season: 'holiday', draws: '1500' })
	})
})

describe('addressQuery', () => {
	const shown = result('abc', { mode: 'premium' })

	it('carries the seed while the settings match the result', () => {
		expect(addressQuery('draws=10', shown, 'draws=10')).toBe('draws=10&seed=abc')
	})

	it('drops the seed once the settings change', () => {
		expect(addressQuery('draws=20', shown, 'draws=10')).toBe('draws=20')
	})

	it('is the settings without a result', () => {
		expect(addressQuery('draws=20', null, '')).toBe('draws=20')
	})
})

describe('restoreSelection', () => {
	it('is empty without a share', () => {
		expect(restoreSelection(null, items)).toEqual({ target: '', rateups: [] })
	})

	it('resolves rate-ups among SSRs only', () => {
		const share = {
			...SHARE_DEFAULTS,
			target: '1040000000',
			rateups: [
				{ id: '1040000000', percent: '1' },
				{ id: '1040119000', percent: '0.3' }
			]
		}
		expect(restoreSelection(share, items)).toEqual({
			target: 'Weapon:4',
			rateups: [{ identity: 'Weapon:2', percent: '0.3' }]
		})
	})
})
