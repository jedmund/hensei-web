import { describe, it, expect } from 'vitest'
import { isoToJstInput, jstInputToIso, formatJstDateTime } from '../jstDateTime'

describe('jstDateTime', () => {
	it('shows a UTC timestamp as JST wall-clock time', () => {
		expect(isoToJstInput('2026-10-07T08:00:00Z')).toBe('2026-10-07T17:00')
		expect(isoToJstInput('2026-10-14T07:59:00.000Z')).toBe('2026-10-14T16:59')
	})

	it('crosses the date line correctly', () => {
		expect(isoToJstInput('2026-10-31T20:00:00Z')).toBe('2026-11-01T05:00')
	})

	it('converts JST input back to UTC ISO', () => {
		expect(jstInputToIso('2026-10-07T17:00')).toBe('2026-10-07T08:00:00.000Z')
	})

	it('round-trips', () => {
		const iso = '2026-12-31T15:30:00.000Z'
		expect(jstInputToIso(isoToJstInput(iso))).toBe(iso)
	})

	it('rejects empty or malformed values', () => {
		expect(isoToJstInput(null)).toBe('')
		expect(isoToJstInput('nope')).toBe('')
		expect(jstInputToIso('')).toBeNull()
		expect(jstInputToIso('2026-10-07 17:00')).toBeNull()
	})

	it('formats for display', () => {
		expect(formatJstDateTime('2026-10-07T08:00:00Z')).toBe('2026/10/07 17:00')
		expect(formatJstDateTime(undefined)).toBe('—')
	})
})
