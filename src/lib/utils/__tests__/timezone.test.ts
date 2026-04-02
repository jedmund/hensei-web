import { describe, it, expect } from 'vitest'
import { formatTimezone, formatTimezoneShort } from '../timezone'

describe('formatTimezone', () => {
	it('includes the timezone name and an offset for America/New_York', () => {
		const result = formatTimezone('America/New_York')
		expect(result).toContain('America/New_York')
		// Offset format varies by runtime: "GMT-4", "UTC-5", "UTC-05:00", etc.
		expect(result).toMatch(/\((GMT|UTC)[+-]/)
	})

	it('returns a positive offset for Asia/Tokyo', () => {
		const result = formatTimezone('Asia/Tokyo')
		expect(result).toContain('Asia/Tokyo')
		// Tokyo is always +9, format varies: "GMT+9", "UTC+09:00", etc.
		expect(result).toMatch(/\((GMT|UTC)\+0?9/)
	})

	it('formats UTC with a zero offset', () => {
		const result = formatTimezone('UTC')
		expect(result).toContain('UTC')
		// Zero offset varies: "GMT", "GMT+0", "UTC", "UTC+00:00"
		expect(result).toMatch(/\((GMT(\+0)?|UTC(\+00:00)?)\)/)
	})
})

describe('formatTimezoneShort', () => {
	it('returns a negative offset for America/New_York', () => {
		const result = formatTimezoneShort('America/New_York')
		// Eastern is -5 or -4 depending on DST, format varies
		expect(result).toMatch(/(GMT|UTC)-0?[45]/)
	})

	it('returns +9 offset for Asia/Tokyo', () => {
		const result = formatTimezoneShort('Asia/Tokyo')
		expect(result).toMatch(/(GMT|UTC)\+0?9/)
	})

	it('returns zero offset for UTC', () => {
		const result = formatTimezoneShort('UTC')
		// "GMT", "GMT+0", "UTC", "UTC+00:00"
		expect(result).toMatch(/^(GMT(\+0)?|UTC(\+00:00)?)$/)
	})
})
