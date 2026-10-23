import { describe, it, expect } from 'vitest'
import { seriesHasUlbArt, SUMMON_ULB_ART_SLUGS } from '../summonSeries'

describe('seriesHasUlbArt', () => {
	it('returns true for Odious', () => {
		expect(seriesHasUlbArt({ id: '1', slug: 'odious', name: { en: 'Odious', ja: '禁禍' } })).toBe(
			true
		)
	})

	it('returns false for other series', () => {
		expect(seriesHasUlbArt({ id: '2', slug: 'providence' })).toBe(false)
		expect(seriesHasUlbArt({ id: '3', slug: 'optimus' })).toBe(false)
	})

	it('only Odious is currently in the allow-list', () => {
		expect(SUMMON_ULB_ART_SLUGS).toEqual(['odious'])
	})

	it('accepts the trimmed series from party list views', () => {
		expect(seriesHasUlbArt({ id: '1', slug: 'odious' })).toBe(true)
	})

	it('returns false for null/undefined', () => {
		expect(seriesHasUlbArt(null)).toBe(false)
		expect(seriesHasUlbArt(undefined)).toBe(false)
	})
})
