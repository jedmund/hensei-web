import { describe, it, expect } from 'vitest'
import { exploreQuery, raidsWithParties, timeRemaining } from '../home'
import type { HomeRaidSection } from '$lib/types/api/home'

const now = Date.parse('2026-10-17T00:00:00Z')

describe('timeRemaining', () => {
	it('counts whole days, rounding up', () => {
		expect(timeRemaining('2026-10-19T12:00:00Z', now)).toEqual({ unit: 'days', value: 3 })
	})

	it('switches to hours under a day', () => {
		expect(timeRemaining('2026-10-17T05:30:00Z', now)).toEqual({ unit: 'hours', value: 6 })
	})

	it('returns null once ended or invalid', () => {
		expect(timeRemaining('2026-10-16T00:00:00Z', now)).toBeNull()
		expect(timeRemaining('bad', now)).toBeNull()
	})
})

describe('raidsWithParties', () => {
	it('drops raids without teams and keeps API order', () => {
		const raids = [
			{ raid: { id: 'a' }, parties: [{}] },
			{ raid: { id: 'b' }, parties: [] },
			{ raid: { id: 'c' }, parties: [{}] }
		] as unknown as HomeRaidSection[]
		expect(raidsWithParties(raids).map((r) => r.raid.id)).toEqual(['a', 'c'])
	})
})

describe('exploreQuery', () => {
	it('builds explore links with raid, element, label and sort', () => {
		expect(exploreQuery({ raidSlug: 'nm200', element: 4, sticker: 'fast' })).toBe(
			'?raid=nm200&element=earth&label=fast'
		)
		expect(exploreQuery({ sort: 'participation' })).toBe('?sort=participation')
		expect(exploreQuery({ element: 0 })).toBe('')
	})
})
