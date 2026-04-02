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
