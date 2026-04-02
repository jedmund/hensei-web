import { describe, it, expect } from 'vitest'
import {
	formatTimezone,
	formatTimezoneShort,
	formatTimezoneTrigger,
	getTimezoneName,
	getTimezoneCity,
	getTimezoneHourDiff,
	getTimezoneOptions,
	normalizeTimezone
} from '../timezone'

describe('getTimezoneCity', () => {
	it('extracts city from simple IANA path', () => {
		expect(getTimezoneCity('Asia/Tokyo')).toBe('Tokyo')
	})

	it('extracts city from nested IANA path', () => {
		expect(getTimezoneCity('America/Argentina/Buenos_Aires')).toBe('Buenos Aires')
	})

	it('replaces underscores with spaces', () => {
		expect(getTimezoneCity('America/Los_Angeles')).toBe('Los Angeles')
	})
})

describe('getTimezoneName', () => {
	it('returns a generic name, not an IANA identifier', () => {
		const name = getTimezoneName('America/New_York')
		expect(name).not.toContain('/')
		expect(name.length).toBeGreaterThan(0)
	})

	it('returns the same generic name for zones in the same region', () => {
		// Detroit and New York are both Eastern Time
		expect(getTimezoneName('America/New_York')).toBe(getTimezoneName('America/Detroit'))
	})

	it('returns different names for zones with different rules', () => {
		expect(getTimezoneName('America/New_York')).not.toBe(getTimezoneName('Asia/Tokyo'))
	})
})

describe('formatTimezone', () => {
	it('combines IANA identifier with offset in parens', () => {
		const result = formatTimezone('Asia/Tokyo')
		expect(result).toMatch(/^Asia\/Tokyo \(.+\)$/)
	})

	it('preserves the original IANA identifier verbatim', () => {
		expect(formatTimezone('America/New_York')).toContain('America/New_York')
	})
})

describe('formatTimezoneShort', () => {
	it('returns abbreviation when runtime supports it, offset otherwise', () => {
		const result = formatTimezoneShort('America/New_York')
		// EDT/EST on runtimes with full ICU, GMT-4/GMT-5 otherwise
		expect(result).toMatch(/^(E[DS]T|(GMT|UTC)-0?[45])$/)
	})

	it('returns a valid label for zones without common abbreviations', () => {
		const result = formatTimezoneShort('Asia/Kolkata')
		// IST on some runtimes, GMT+5:30 on others
		expect(result).toMatch(/^(IST|(GMT|UTC)\+0?5:30)$/)
	})

	it('returns different values for zones with different offsets', () => {
		const eastern = formatTimezoneShort('America/New_York')
		const tokyo = formatTimezoneShort('Asia/Tokyo')
		expect(eastern).not.toBe(tokyo)
	})
})

describe('formatTimezoneTrigger', () => {
	it('includes abbreviation with offset in parens when available', () => {
		const result = formatTimezoneTrigger('America/New_York')
		// "EDT (GMT-4)" with abbreviation, or just "GMT-4" without
		expect(result).toMatch(/^(E[DS]T \(GMT-[45]\)|(GMT|UTC)-0?[45])$/)
	})

	it('is never empty', () => {
		const result = formatTimezoneTrigger('Asia/Kolkata')
		expect(result.length).toBeGreaterThan(0)
	})
})

describe('getTimezoneHourDiff', () => {
	it('returns 0 for the local timezone', () => {
		const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone
		expect(getTimezoneHourDiff(localTz)).toBe(0)
	})

	it('returns consistent relative difference between two fixed-offset zones', () => {
		const nyDiff = getTimezoneHourDiff('America/New_York')
		const tokyoDiff = getTimezoneHourDiff('Asia/Tokyo')
		// Tokyo is 13h ahead of NY during EDT, 14h during EST
		const gap = tokyoDiff - nyDiff
		expect(gap).toBeGreaterThanOrEqual(13)
		expect(gap).toBeLessThanOrEqual(14)
	})
})

describe('getTimezoneOptions', () => {
	it('returns fewer entries than raw IANA zones', () => {
		const options = getTimezoneOptions()
		const rawCount = Intl.supportedValuesOf('timeZone').length
		expect(options.length).toBeLessThan(rawCount)
		expect(options.length).toBeGreaterThan(20) // sanity check
	})

	it('returns options sorted west to east by offset', () => {
		const options = getTimezoneOptions()
		const labels = options.map((o) => o.label)
		// First option should be a negative offset (western), last should be positive (eastern)
		expect(labels[0]).toMatch(/GMT-1[12]/)
		expect(labels[labels.length - 1]).toMatch(/GMT\+1[34]/)
	})

	it('each option has a non-empty subtitle with city names', () => {
		const options = getTimezoneOptions()
		for (const opt of options) {
			expect(opt.subtitle.length).toBeGreaterThan(0)
			// Subtitles should not contain IANA-style slashes
			expect(opt.subtitle).not.toContain('/')
		}
	})

	it('separates zones with different DST rules at the same base offset', () => {
		const options = getTimezoneOptions()
		// Arizona (no DST, always GMT-7) and LA (DST, GMT-7 in winter / GMT-8 in summer)
		// should appear as separate entries
		const hasArizona = options.some((o) => o.subtitle.includes('Phoenix'))
		const hasLA = options.some((o) => o.subtitle.includes('Los Angeles'))
		expect(hasArizona).toBe(true)
		expect(hasLA).toBe(true)
		// They should be in different option groups
		const arizonaOpt = options.find((o) => o.subtitle.includes('Phoenix'))
		const laOpt = options.find((o) => o.subtitle.includes('Los Angeles'))
		expect(arizonaOpt!.value).not.toBe(laOpt!.value)
	})

	it('produces far fewer options than raw IANA zones', () => {
		const options = getTimezoneOptions()
		const rawCount = Intl.supportedValuesOf('timeZone').length
		// Aggressive dedup should reduce 400+ zones to under 80
		expect(options.length).toBeLessThan(rawCount / 5)
	})
})

describe('normalizeTimezone', () => {
	it('maps equivalent zones to the same representative', () => {
		// Indianapolis and New York follow the same rules
		expect(normalizeTimezone('America/Indianapolis')).toBe(normalizeTimezone('America/New_York'))
	})

	it('keeps zones with different rules separate', () => {
		expect(normalizeTimezone('America/New_York')).not.toBe(normalizeTimezone('America/Phoenix'))
	})

	it('returns the input for unknown timezone strings', () => {
		expect(normalizeTimezone('Not/A/Timezone')).toBe('Not/A/Timezone')
	})
})
