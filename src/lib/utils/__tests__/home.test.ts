import { describe, it, expect } from 'vitest'
import { countdown, exploreQuery, raidsWithParties } from '../home'
import type { HomeRaidSection } from '$lib/types/api/home'
import { ElementId } from '$lib/utils/element'

const now = Date.parse('2026-10-17T00:00:00Z')

describe('countdown', () => {
	it('splits the time left into days, hours and minutes', () => {
		expect(countdown('2026-10-19T03:15:00Z', now)).toEqual({ days: 2, hours: 3, minutes: 15 })
	})

	it('rounds partial minutes up', () => {
		expect(countdown('2026-10-17T00:00:30Z', now)).toEqual({ days: 0, hours: 0, minutes: 1 })
	})

	it('returns null once passed or invalid', () => {
		expect(countdown('2026-10-16T00:00:00Z', now)).toBeNull()
		expect(countdown('bad', now)).toBeNull()
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
	it('builds Gallery links with raid, element and sort', () => {
		expect(exploreQuery({ raidSlug: 'nm200', element: ElementId.Earth })).toBe(
			'?raid=nm200&element=earth'
		)
		expect(exploreQuery({ sort: 'rising' })).toBe('?sort=rising')
		expect(exploreQuery({ element: 0 })).toBe('')
	})
})
