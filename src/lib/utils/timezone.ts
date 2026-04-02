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
 * Format a short timezone label for display.
 * Returns the abbreviation (e.g. "PST", "EDT") when available,
 * or falls back to the UTC offset (e.g. "GMT+9").
 */
export function formatTimezoneShort(tz: string): string {
	return getAbbreviation(tz) ?? getUtcOffset(tz)
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

/**
 * Get the hour difference between a timezone and the viewer's local timezone.
 * Positive = ahead, negative = behind, 0 = same.
 */
export function getTimezoneHourDiff(tz: string): number {
	const now = new Date()
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone: tz,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	})
	const parts = formatter.formatToParts(now)
	const get = (type: Intl.DateTimeFormatPartTypes) =>
		parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10)

	const remoteDate = new Date(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'))
	const localDate = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		now.getHours(),
		now.getMinutes()
	)

	const diffMs = remoteDate.getTime() - localDate.getTime()
	return Math.round(diffMs / (1000 * 60 * 60))
}

interface TimezoneOption {
	value: string
	label: string
	triggerLabel: string
	subtitle: string
}

/** Parse a shortOffset string like "GMT-7" or "GMT+5:30" into total minutes for sorting. */
function offsetToMinutes(offset: string): number {
	const match = offset.match(/^GMT([+-])(\d+)(?::(\d+))?$/)
	if (!match) return 0
	const sign = match[1] === '+' ? 1 : -1
	const hours = parseInt(match[2]!, 10)
	const minutes = parseInt(match[3] ?? '0', 10)
	return sign * (hours * 60 + minutes)
}

/** Get the raw UTC offset string at a specific date for grouping purposes. */
function getOffsetAt(tz: string, date: Date): string {
	try {
		const formatter = new Intl.DateTimeFormat('en-US', {
			timeZone: tz,
			timeZoneName: 'shortOffset'
		})
		const parts = formatter.formatToParts(date)
		return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
	} catch {
		return ''
	}
}

/**
 * Build a deduplicated list of timezone options for select dropdowns.
 * Groups IANA identifiers by their offset behavior across the year
 * (January + July offsets), so zones with different DST rules stay separate
 * but zones at the same offset year-round are merged.
 */
export function getTimezoneOptions(): TimezoneOption[] {
	const allZones = Intl.supportedValuesOf('timeZone')

	// Use Jan and Jul to capture DST differences
	const jan = new Date(2025, 0, 15)
	const jul = new Date(2025, 6, 15)

	const groups = new Map<
		string,
		{ name: string; offset: string; zones: string[]; triggerLabel: string }
	>()

	for (const tz of allZones) {
		const janOffset = getOffsetAt(tz, jan)
		const julOffset = getOffsetAt(tz, jul)
		const key = `${janOffset}|${julOffset}`

		if (!groups.has(key)) {
			const name = getTimezoneName(tz)
			const offset = getUtcOffset(tz)
			groups.set(key, { name, offset, zones: [], triggerLabel: formatTimezoneTrigger(tz) })
		}
		groups.get(key)!.zones.push(tz)
	}

	const options: (TimezoneOption & { _sortKey: number })[] = []
	for (const [, group] of groups) {
		// Pick the representative: prefer the shortest IANA path (most canonical)
		const representative = group.zones.sort((a, b) => a.length - b.length)[0]!
		const cities = group.zones.map(getTimezoneCity)
		// Show up to 5 cities, then "..."
		const cityList =
			cities.length <= 5 ? cities.join(', ') : `${cities.slice(0, 5).join(', ')}, ...`

		options.push({
			value: representative,
			label: `${group.name} (${group.offset})`,
			triggerLabel: group.triggerLabel,
			subtitle: cityList,
			_sortKey: offsetToMinutes(group.offset)
		})
	}

	// Sort by UTC offset (west to east)
	options.sort((a, b) => a._sortKey - b._sortKey)

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	return options.map(({ _sortKey, ...opt }) => opt)
}

let normalizeMap: Map<string, string> | undefined

/** Build a map from every IANA zone to its representative (shortest in its group). */
function getNormalizeMap(): Map<string, string> {
	if (normalizeMap) return normalizeMap
	normalizeMap = new Map()

	const allZones = Intl.supportedValuesOf('timeZone')
	const jan = new Date(2025, 0, 15)
	const jul = new Date(2025, 6, 15)
	const groups = new Map<string, string[]>()

	for (const tz of allZones) {
		const key = `${getOffsetAt(tz, jan)}|${getOffsetAt(tz, jul)}`
		if (!groups.has(key)) groups.set(key, [])
		groups.get(key)!.push(tz)
	}

	for (const [, zones] of groups) {
		const representative = zones.sort((a, b) => a.length - b.length)[0]!
		for (const tz of zones) {
			normalizeMap.set(tz, representative)
		}
	}

	return normalizeMap
}

/**
 * Map any IANA timezone to the representative value used in getTimezoneOptions().
 * Falls through to the original value if no mapping is found.
 */
export function normalizeTimezone(tz: string): string {
	return getNormalizeMap().get(tz) ?? tz
}
