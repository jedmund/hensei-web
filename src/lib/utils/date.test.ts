import { describe, expect, it } from 'vitest'
import { formatRelativeTime } from './date'

describe('formatRelativeTime', () => {
	it('returns relative time for a recent valid ISO date', () => {
		const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString()
		const result = formatRelativeTime(fiveMinutesAgo)
		expect(result).toMatch(/minute/)
	})

	it('returns absolute date for dates beyond cutoff', () => {
		const twoWeeksAgo = new Date(Date.now() - 14 * 86_400_000).toISOString()
		const result = formatRelativeTime(twoWeeksAgo)
		// Should be an absolute date string, not a relative one
		expect(result).not.toMatch(/ago/)
	})

	it('returns the raw string for an invalid date without throwing', () => {
		expect(formatRelativeTime('not-a-date')).toBe('not-a-date')
	})

	it('returns the raw string for an empty string without throwing', () => {
		expect(formatRelativeTime('')).toBe('')
	})

	it('handles dates that some browsers fail to parse', () => {
		// Space-separated datetime (fails in Safari)
		const result = formatRelativeTime('2024-01-15 10:30:00')
		expect(typeof result).toBe('string')
	})
})
