import * as m from '$lib/paraglide/messages'

const DAY_MS = 1000 * 60 * 60 * 24

/**
 * Label for a GW event's status. Upcoming events count down the days to their
 * start; other statuses are shown as-is (the list capitalises them).
 */
export function formatEventStatus(status: string, startDate: string, now = new Date()): string {
	if (status === 'upcoming') {
		const start = new Date(startDate)
		const diffDays = Math.ceil((start.getTime() - now.getTime()) / DAY_MS)
		if (diffDays <= 0) return m.crew_starting_soon()
		if (diffDays === 1) return m.crew_starts_in_1_day()
		return m.crew_starts_in_days({ days: String(diffDays) })
	}
	return status
}
