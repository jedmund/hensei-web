/**
 * Format a timezone offset from an IANA timezone string.
 * Returns just the offset portion, e.g. "UTC-5" or "UTC+9".
 */
function getUtcOffset(tz: string): string {
	try {
		const formatter = new Intl.DateTimeFormat('en-US', {
			timeZone: tz,
			timeZoneName: 'shortOffset'
		})
		const parts = formatter.formatToParts(new Date())
		const tzPart = parts.find((p) => p.type === 'timeZoneName')
		return tzPart?.value ?? tz
	} catch {
		return tz
	}
}

/**
 * Format an IANA timezone string with its UTC offset.
 * e.g. "America/New_York" → "America/New_York (UTC-5)"
 */
export function formatTimezone(tz: string): string {
	const offset = getUtcOffset(tz)
	return `${tz} (${offset})`
}

/**
 * Format just the UTC offset from an IANA timezone string.
 * e.g. "America/New_York" → "UTC-5"
 */
export function formatTimezoneShort(tz: string): string {
	return getUtcOffset(tz)
}

/**
 * Get the abbreviated timezone name (e.g. "PST", "EDT") if available.
 * Returns undefined when the runtime falls back to an offset like "GMT+9".
 */
function getAbbreviation(tz: string): string | undefined {
	try {
		const formatter = new Intl.DateTimeFormat('en-US', {
			timeZone: tz,
			timeZoneName: 'short'
		})
		const parts = formatter.formatToParts(new Date())
		const name = parts.find((p) => p.type === 'timeZoneName')?.value
		// If the short name is just an offset (e.g. "GMT+9"), it's not a useful abbreviation
		if (name && !/^(GMT|UTC)/.test(name)) return name
		return undefined
	} catch {
		return undefined
	}
}

/**
 * Format a compact trigger label for timezone selects.
 * Returns "PST (GMT-8)" when an abbreviation exists, or just the offset otherwise.
 */
export function formatTimezoneTrigger(tz: string): string {
	const offset = getUtcOffset(tz)
	const abbr = getAbbreviation(tz)
	return abbr ? `${abbr} (${offset})` : offset
}

/**
 * Get a human-readable timezone name using Intl longGeneric format.
 * e.g. "America/Los_Angeles" → "Pacific Time"
 *      "Asia/Tokyo" → "Japan Standard Time"
 */
export function getTimezoneName(tz: string): string {
	try {
		const formatter = new Intl.DateTimeFormat('en-US', {
			timeZone: tz,
			timeZoneName: 'longGeneric'
		})
		const parts = formatter.formatToParts(new Date())
		const name = parts.find((p) => p.type === 'timeZoneName')?.value
		return name ?? tz
	} catch {
		return tz
	}
}

/**
 * Extract a human-readable city/region from an IANA timezone identifier.
 * e.g. "America/Los_Angeles" → "Los Angeles"
 *      "America/Argentina/Buenos_Aires" → "Buenos Aires"
 *      "Asia/Tokyo" → "Tokyo"
 */
export function getTimezoneCity(tz: string): string {
	const parts = tz.split('/')
	const city = parts[parts.length - 1]
	return city?.replace(/_/g, ' ') ?? tz
}
