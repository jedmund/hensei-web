import { describe, it, expect } from 'vitest'
import { buildFeatureRows, nextPickPosition } from '../featurePicks'
import type { GameEvent } from '$lib/types/api/event'
import type { FeaturedParty } from '$lib/types/api/featuredParty'

const now = Date.parse('2026-10-31T00:00:00Z')

function event(id: string, startsAt: string, endsAt: string, extra: Partial<GameEvent> = {}) {
	return { id, startsAt, endsAt, status: 'approved', raids: [], ...extra } as unknown as GameEvent
}

function pick(id: string, eventId: string | null, position = 0) {
	return { id, eventId, position } as unknown as FeaturedParty
}

const runningLate = event('run-late', '2026-10-30T00:00:00Z', '2026-11-05T00:00:00Z')
const runningEarly = event('run-early', '2026-10-20T00:00:00Z', '2026-11-01T00:00:00Z')
const soon = event('soon', '2026-11-02T00:00:00Z', '2026-11-09T00:00:00Z')
const later = event('later', '2026-11-20T00:00:00Z', '2026-11-27T00:00:00Z')
const past = event('past', '2026-10-01T00:00:00Z', '2026-10-08T00:00:00Z')

describe('buildFeatureRows', () => {
	it('lists General, then running events, then upcoming ones by start date', () => {
		const rows = buildFeatureRows({
			current: [runningLate, runningEarly],
			upcoming: [later, soon],
			picks: [],
			role: 6,
			now
		})
		expect(rows.map((r) => r.key)).toEqual(['general', 'run-early', 'run-late', 'soon', 'later'])
		expect(rows.map((r) => r.state)).toEqual([
			'general',
			'running',
			'running',
			'upcoming',
			'upcoming'
		])
		expect(rows.every((r) => r.editable)).toBe(true)
	})

	it('skips unapproved, ended and repeated events', () => {
		const draft = event('draft', '2026-11-02T00:00:00Z', '2026-11-09T00:00:00Z', {
			status: 'draft'
		})
		const rows = buildFeatureRows({
			current: [runningEarly, past],
			upcoming: [draft, soon, soon],
			picks: [],
			role: 7,
			now
		})
		expect(rows.map((r) => r.key)).toEqual(['general', 'run-early', 'soon'])
	})

	it('marks where the team is featured and adds picks on other events last', () => {
		const rows = buildFeatureRows({
			current: [runningEarly],
			upcoming: [soon],
			picks: [pick('p1', null), pick('p2', 'soon'), pick('p3', 'past'), pick('p4', 'missing')],
			pickEvents: { past },
			role: 6,
			now
		})
		expect(rows.map((r) => [r.key, r.pick?.id ?? null])).toEqual([
			['general', 'p1'],
			['run-early', null],
			['soon', 'p2'],
			['past', 'p3'],
			['missing', 'p4']
		])
		const [, , , ended, unknown] = rows
		expect(ended?.state).toBe('ended')
		// Curators can't remove picks for events that have ended (or not loaded)
		expect(ended?.editable).toBe(false)
		expect(unknown?.event).toBeNull()
		expect(unknown?.editable).toBe(false)
	})

	it('lets editors remove picks for events that have ended', () => {
		const rows = buildFeatureRows({
			current: [],
			upcoming: [],
			picks: [pick('p3', 'past')],
			pickEvents: { past },
			role: 7,
			now
		})
		expect(rows.at(-1)?.editable).toBe(true)
	})
})

describe('nextPickPosition', () => {
	it('goes after the highest position', () => {
		expect(nextPickPosition([])).toBe(0)
		expect(nextPickPosition([{ position: 0 }, { position: 4 }, { position: 2 }])).toBe(5)
	})
})
