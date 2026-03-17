/**
 * Format a date string in JST (Japan Standard Time).
 * Use this for game-related dates like GW events, as Granblue Fantasy uses JST.
 */
export function formatDateJST(
	dateString: string,
	options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	}
): string {
	return new Date(dateString).toLocaleDateString(undefined, {
		...options,
		timeZone: 'Asia/Tokyo'
	})
}

/**
 * Format a date string in local time.
 * Use this for user-related dates like join dates, invitation expiries, etc.
 *
 * For date-only strings (YYYY-MM-DD), appends T00:00:00 to parse as local midnight
 * instead of UTC midnight, preventing the date from shifting.
 */
export function formatDate(
	dateString: string,
	options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	}
): string {
	// If it's a date-only string (YYYY-MM-DD), parse as local time
	const dateToFormat =
		dateString.length === 10 ? new Date(dateString + 'T00:00:00') : new Date(dateString)
	return dateToFormat.toLocaleDateString(undefined, options)
}

/**
 * Format a date string with long month format in JST (e.g., "June 21, 2025")
 */
export function formatDateLongJST(dateString: string): string {
	return formatDateJST(dateString, {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	})
}

/**
 * Format a date as a relative time string using the browser's Intl.RelativeTimeFormat.
 * Automatically selects the best unit (seconds → minutes → hours → days → months → years).
 */
export function formatRelativeTime(dateString: string, locale?: string): string {
	const date = new Date(dateString)
	const now = Date.now()
	const diffMs = date.getTime() - now
	const absDiffMs = Math.abs(diffMs)

	const units: [Intl.RelativeTimeFormatUnit, number][] = [
		['second', 1000],
		['minute', 60_000],
		['hour', 3_600_000],
		['day', 86_400_000],
		['month', 2_592_000_000],
		['year', 31_536_000_000]
	]

	let unit: Intl.RelativeTimeFormatUnit = 'second'
	let value = Math.round(diffMs / 1000)

	for (let i = units.length - 1; i >= 0; i--) {
		const entry = units[i]
		if (entry && absDiffMs >= entry[1]) {
			unit = entry[0]
			value = Math.round(diffMs / entry[1])
			break
		}
	}

	const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
	return rtf.format(value, unit)
}
