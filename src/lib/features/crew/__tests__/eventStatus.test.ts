import { describe, it, expect } from 'vitest'
import * as m from '$lib/paraglide/messages'
import { formatEventStatus } from '../eventStatus'

const now = new Date('2026-11-01T12:00:00Z')

describe('formatEventStatus', () => {
	it('passes non-upcoming statuses through', () => {
		expect(formatEventStatus('active', '2026-10-01T00:00:00Z', now)).toBe('active')
		expect(formatEventStatus('completed', '2026-10-01T00:00:00Z', now)).toBe('completed')
		expect(formatEventStatus('unknown', '2026-10-01T00:00:00Z', now)).toBe('unknown')
	})

	it('says starting soon once the start has passed', () => {
		expect(formatEventStatus('upcoming', '2026-11-01T12:00:00Z', now)).toBe(m.crew_starting_soon())
		expect(formatEventStatus('upcoming', '2026-10-30T00:00:00Z', now)).toBe(m.crew_starting_soon())
	})

	it('counts part of a day as a whole day', () => {
		expect(formatEventStatus('upcoming', '2026-11-01T18:00:00Z', now)).toBe(
			m.crew_starts_in_1_day()
		)
		expect(formatEventStatus('upcoming', '2026-11-02T12:00:00Z', now)).toBe(
			m.crew_starts_in_1_day()
		)
	})

	it('counts the days to later starts', () => {
		expect(formatEventStatus('upcoming', '2026-11-02T13:00:00Z', now)).toBe(
			m.crew_starts_in_days({ days: '2' })
		)
		expect(formatEventStatus('upcoming', '2026-11-08T12:00:00Z', now)).toBe(
			m.crew_starts_in_days({ days: '7' })
		)
	})
})
