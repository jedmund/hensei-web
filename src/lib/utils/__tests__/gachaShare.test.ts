import { describe, it, expect } from 'vitest'
import { readShare, seasonalPool, writeShare, SHARE_DEFAULTS, type GachaShare } from '../gachaShare'

const read = (query: string) => readShare(new URLSearchParams(query))

describe('gacha share links', () => {
	it('round-trips a full configuration', () => {
		const share: GachaShare = {
			operation: 'odds',
			mode: 'legend',
			season: 'summer',
			purchase: 'singles',
			draws: '1500',
			copies: '2',
			comparison: 'exactly',
			target: '1040918400',
			rateups: [
				{ id: '1040119000', percent: '0.5' },
				{ id: '2040094000', percent: '1' }
			],
			seed: 'abc123'
		}
		expect(read(writeShare(share))).toEqual(share)
	})

	it('leaves defaults out of the query string', () => {
		expect(writeShare(SHARE_DEFAULTS)).toBe('')
		expect(read('')).toEqual(SHARE_DEFAULTS)
	})

	it('drops values outside the allowlists', () => {
		const share = read('op=steal&pool=gacha&season=spring&purchase=lots&cmp=more')
		expect(share).toMatchObject({
			operation: 'draw',
			mode: 'premium',
			season: '',
			purchase: 'ten',
			comparison: 'at_least'
		})
	})

	it('ignores a season for Classic pools', () => {
		expect(read('pool=classic_ii&season=summer').season).toBe('')
	})

	it('keeps draw and copy counts within the API limits', () => {
		expect(read('draws=0').draws).toBe('300')
		expect(read('draws=1000001').draws).toBe('300')
		expect(read('draws=1e5').draws).toBe('300')
		expect(read('op=odds&draws=1000000000000').draws).toBe('1000000000000')
		expect(read('copies=1001').copies).toBe('1')
		expect(read('copies=05').copies).toBe('5')
	})

	it('accepts only game ids for targets and rate-ups', () => {
		const share = read(
			'target=Weapon:abc&rateup=1040119000:0.5&rateup=1040119000:2&rateup=abc:1&rateup=1040918400:1e3&rateup=2040094000'
		)
		expect(share.target).toBe('')
		expect(share.rateups).toEqual([{ id: '1040119000', percent: '0.5' }])
	})

	it('strips control characters from the seed and caps its length', () => {
		expect(read(`seed=${encodeURIComponent('a\nb\u0000c')}`).seed).toBe('abc')
		expect(read(`seed=${'x'.repeat(200)}`).seed).toHaveLength(128)
	})

	it('omits fields the operation does not use', () => {
		const query = writeShare({
			...SHARE_DEFAULTS,
			draws: '1000',
			copies: '3',
			target: '1040918400',
			comparison: 'exactly'
		})
		expect(query).toBe('draws=1000')
	})

	it('picks the pool running on the day, in Japan time', () => {
		const jst = (day: string) => new Date(`2026-10-${day}T12:00:00+09:00`)
		expect(seasonalPool(jst('01'))).toBe('legend')
		expect(seasonalPool(jst('04'))).toBe('legend')
		expect(seasonalPool(jst('05'))).toBe('premium')
		expect(seasonalPool(jst('15'))).toBe('flash')
		expect(seasonalPool(jst('20'))).toBe('flash')
		expect(seasonalPool(jst('21'))).toBe('premium')
		expect(seasonalPool(jst('28'))).toBe('legend')
		expect(seasonalPool(jst('31'))).toBe('legend')
		// 23:30 UTC on the 27th is already the 28th in Japan
		expect(seasonalPool(new Date('2026-10-27T23:30:00Z'))).toBe('legend')
	})
})
