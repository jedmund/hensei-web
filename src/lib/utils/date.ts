import * as m from '$lib/paraglide/messages'

/**
 * Format a date string as relative time (e.g. "2 days ago") up to 1 week,
 * then as an absolute date (e.g. "March 1, 2026").
 */
export function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString)
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffSeconds = Math.floor(diffMs / 1000)
	const diffMinutes = Math.floor(diffSeconds / 60)
	const diffHours = Math.floor(diffMinutes / 60)
	const diffDays = Math.floor(diffHours / 24)

	if (diffSeconds < 60) return m.time_just_now()
	if (diffMinutes === 1) return m.time_minute_ago()
	if (diffMinutes < 60) return m.time_minutes_ago({ count: diffMinutes })
	if (diffHours === 1) return m.time_hour_ago()
	if (diffHours < 24) return m.time_hours_ago({ count: diffHours })
	if (diffDays === 1) return m.time_yesterday()
	if (diffDays < 7) return m.time_days_ago({ count: diffDays })
	if (diffDays < 14) return m.time_one_week_ago()

	return date.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	})
}

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
