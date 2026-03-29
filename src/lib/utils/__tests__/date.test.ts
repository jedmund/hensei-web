import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatRelativeTime } from '../date'

describe('formatRelativeTime', () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	function setNow(iso: string) {
		vi.useFakeTimers()
		vi.setSystemTime(new Date(iso))
	}

	it('returns a relative string for dates within 7 days', () => {
		setNow('2026-03-29T12:00:00Z')
		const threeDaysAgo = '2026-03-26T12:00:00Z'
		const result = formatRelativeTime(threeDaysAgo, 'en')
		expect(result).toBe('3 days ago')
	})

	it('returns an absolute date for dates older than 7 days', () => {
		setNow('2026-03-29T12:00:00Z')
		const eightDaysAgo = '2026-03-21T12:00:00Z'
		const result = formatRelativeTime(eightDaysAgo, 'en')
		// formatDate returns locale-formatted string; just check it's not relative
		expect(result).not.toContain('ago')
		expect(result).toContain('2026')
	})

	it('returns an absolute date at exactly 7 days', () => {
		setNow('2026-03-29T12:00:00Z')
		const exactlySevenDays = '2026-03-22T12:00:00Z'
		const result = formatRelativeTime(exactlySevenDays, 'en')
		expect(result).not.toContain('ago')
		expect(result).toContain('2026')
	})

	it('returns relative for just under 7 days', () => {
		setNow('2026-03-29T12:00:00Z')
		const justUnder = '2026-03-22T12:00:01Z'
		const result = formatRelativeTime(justUnder, 'en')
		expect(result).toContain('ago')
	})

	it('respects a custom cutoffDays', () => {
		setNow('2026-03-29T12:00:00Z')
		const threeDaysAgo = '2026-03-26T12:00:00Z'
		// With cutoff of 2, 3 days ago should be absolute
		const result = formatRelativeTime(threeDaysAgo, 'en', 2)
		expect(result).not.toContain('ago')
	})
})
