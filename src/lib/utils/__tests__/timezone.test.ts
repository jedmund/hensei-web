import { describe, it, expect } from 'vitest'
import { formatTimezone, formatTimezoneShort } from '../timezone'

describe('formatTimezone', () => {
	it('includes the timezone name and a UTC offset for America/New_York', () => {
		const result = formatTimezone('America/New_York')
		expect(result).toContain('America/New_York')
		expect(result).toMatch(/\(UTC[+-]\d{2}:\d{2}\)/)
	})

	it('returns JST offset for Asia/Tokyo', () => {
		const result = formatTimezone('Asia/Tokyo')
		expect(result).toContain('Asia/Tokyo')
		// Tokyo is always UTC+09:00 (no DST)
		expect(result).toBe('Asia/Tokyo (UTC+09:00)')
	})

	it('formats UTC as UTC+00:00', () => {
		const result = formatTimezone('UTC')
		expect(result).toBe('UTC (UTC+00:00)')
	})
})

describe('formatTimezoneShort', () => {
	it('returns only the UTC offset for America/New_York', () => {
		const result = formatTimezoneShort('America/New_York')
		// Eastern is UTC-05:00 or UTC-04:00 depending on DST
		expect(result).toMatch(/^UTC-0[45]:00$/)
	})

	it('returns UTC+09:00 for Asia/Tokyo', () => {
		const result = formatTimezoneShort('Asia/Tokyo')
		expect(result).toBe('UTC+09:00')
	})

	it('returns UTC+00:00 for UTC', () => {
		const result = formatTimezoneShort('UTC')
		expect(result).toBe('UTC+00:00')
	})
})
