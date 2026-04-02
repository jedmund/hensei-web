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
	it('returns abbreviation or offset for America/New_York', () => {
		const result = formatTimezoneShort('America/New_York')
		// "EDT", "EST", or fallback offset like "GMT-4"
		expect(result).toMatch(/^(E[DS]T|(GMT|UTC)-0?[45])$/)
	})

	it('returns abbreviation or offset for Asia/Tokyo', () => {
		const result = formatTimezoneShort('Asia/Tokyo')
		// "JST" or fallback offset like "GMT+9"
		expect(result).toMatch(/^(JST|(GMT|UTC)\+0?9)$/)
	})

	it('returns zero offset for UTC', () => {
		const result = formatTimezoneShort('UTC')
		// "GMT", "GMT+0", "UTC", "UTC+00:00"
		expect(result).toMatch(/^(GMT(\+0)?|UTC(\+00:00)?)$/)
	})
})
