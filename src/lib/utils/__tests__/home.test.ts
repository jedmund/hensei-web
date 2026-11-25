import { describe, it, expect } from 'vitest'
import {
	countdown,
	countdownLabel,
	defaultEventRaid,
	eventThumbnailUrl,
	exploreQuery,
	raidsWithParties,
	eventAdvantageElements
} from '../home'
import type { GameEvent } from '$lib/types/api/event'
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

describe('defaultEventRaid', () => {
	// EX has the most teams; NM100 and NM150 open on day 3, NM200 on day 4
	const tabs = [
		{ raid: { id: 'ex' }, parties: [{}, {}, {}] },
		{ raid: { id: 'nm100' }, parties: [{}] },
		{ raid: { id: 'nm150' }, parties: [{}] },
		{ raid: { id: 'nm200' }, parties: [] }
	] as unknown as HomeRaidSection[]
	const event = {
		raids: [
			{ id: 'ex', unlocksAt: null },
			{ id: 'nm100', unlocksAt: '2026-10-19T10:00:00Z' },
			{ id: 'nm150', unlocksAt: '2026-10-19T10:00:00Z' },
			{ id: 'nm200', unlocksAt: '2026-10-20T10:00:00Z' }
		]
	} as unknown as GameEvent

	it('opens on the busiest raid before any raid opens later', () => {
		expect(defaultEventRaid(tabs, event, now)).toBe('ex')
	})

	it('opens on the raid that opened most recently, even without teams', () => {
		expect(defaultEventRaid(tabs, event, Date.parse('2026-10-20T10:00:00Z'))).toBe('nm200')
	})

	it('takes the last listed of raids that opened together', () => {
		expect(defaultEventRaid(tabs, event, Date.parse('2026-10-19T12:00:00Z'))).toBe('nm150')
	})

	it('goes by teams alone for upcoming events and older APIs', () => {
		const later = Date.parse('2026-10-21T00:00:00Z')
		expect(defaultEventRaid(tabs, event, later, 'upcoming')).toBe('ex')
		const legacy = { raids: [{ id: 'ex' }, { id: 'nm200' }] } as unknown as GameEvent
		expect(defaultEventRaid(tabs, legacy, later)).toBe('ex')
	})

	it('returns null without tabs', () => {
		expect(defaultEventRaid([], event, now)).toBeNull()
	})
})

describe('exploreQuery', () => {
	it('builds Gallery links with raid, element and sort', () => {
		expect(exploreQuery({ raidSlug: 'nm200', elements: [ElementId.Earth] })).toBe(
			'?raid=nm200&element=earth'
		)
		expect(exploreQuery({ sort: 'rising' })).toBe('?sort=rising')
		expect(exploreQuery({ elements: [0] })).toBe('')
	})

	it('carries both elements of a two-element event', () => {
		expect(
			exploreQuery({ raidSlug: 'rott-nm150', elements: [ElementId.Fire, ElementId.Dark] })
		).toBe(`?raid=rott-nm150&element=${encodeURIComponent('fire,dark')}`)
	})
})

describe('eventAdvantageElements', () => {
	it('prefers the list, then the single element', () => {
		expect(
			eventAdvantageElements({ advantageElement: ElementId.Fire, advantageElements: [1, 6] })
		).toEqual([1, 6])
		expect(eventAdvantageElements({ advantageElement: ElementId.Earth })).toEqual([ElementId.Earth])
		expect(eventAdvantageElements({ advantageElement: null })).toEqual([])
	})
})

describe('eventThumbnailUrl', () => {
	it("uses the event's image, then its first raid's art", () => {
		const withImage = { imageUrl: 'https://cdn.example/events/a.webp', raids: [] }
		expect(eventThumbnailUrl(withImage)).toBe('https://cdn.example/events/a.webp')

		const withRaid = { imageUrl: null, raids: [{ slug: 'lucilius' }] } as never
		expect(eventThumbnailUrl(withRaid)).toContain('lucilius')
		expect(eventThumbnailUrl(withRaid, 'beelzebub')).toContain('beelzebub')

		expect(eventThumbnailUrl({ imageUrl: null, raids: [] })).toBeNull()
	})
})

describe('countdownLabel', () => {
	it('is empty once the time has passed', () => {
		expect(countdownLabel('2026-10-16T00:00:00Z', now)).toBe('')
		expect(countdownLabel('2026-10-19T03:15:00Z', now)).not.toBe('')
	})
})
