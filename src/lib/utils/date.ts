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
