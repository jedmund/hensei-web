/**
 * Rows for the "Feature this team" dialog: where a team can be featured and
 * where it already is.
 */

import { canEditStaffPicks } from '$lib/auth/roles'
import type { GameEvent } from '$lib/types/api/event'
import type { FeaturedParty } from '$lib/types/api/featuredParty'

export type FeatureRowState = 'general' | 'running' | 'upcoming' | 'ended'

export interface FeatureRow {
	key: string
	/** null for the General row */
	eventId: string | null
	/** null for the General row, or while a featured event is loading */
	event: GameEvent | null
	state: FeatureRowState
	/** The team's pick here, if it's featured here */
	pick: FeaturedParty | undefined
	/** Whether this role can add or remove the pick here */
	editable: boolean
}

interface BuildOptions {
	/** Running events (`scope=current`) */
	current: GameEvent[]
	/** Upcoming events (`scope=upcoming`) */
	upcoming: GameEvent[]
	/** The team's picks (`party_id=`) */
	picks: FeaturedParty[]
	/** Events of picks that aren't running or upcoming, by id */
	pickEvents?: Record<string, GameEvent | undefined>
	role: number | null | undefined
	now?: number
}

function rowState(event: GameEvent | null, now: number): FeatureRowState {
	if (!event) return 'ended'
	if (Date.parse(event.endsAt) <= now) return 'ended'
	return Date.parse(event.startsAt) <= now ? 'running' : 'upcoming'
}

const byStart = (a: GameEvent, b: GameEvent) => Date.parse(a.startsAt) - Date.parse(b.startsAt)

/**
 * General first, then running events, then upcoming ones by start date (both
 * approved only), then any other event the team is featured in, newest first.
 */
export function buildFeatureRows({
	current,
	upcoming,
	picks,
	pickEvents = {},
	role,
	now = Date.now()
}: BuildOptions): FeatureRow[] {
	const pickFor = (eventId: string | null) => picks.find((p) => (p.eventId ?? null) === eventId)

	const rows: FeatureRow[] = [
		{
			key: 'general',
			eventId: null,
			event: null,
			state: 'general',
			pick: pickFor(null),
			editable: canEditStaffPicks(role, null, now)
		}
	]

	const seen = new Set<string>()
	const listed = [...current].sort(byStart).concat([...upcoming].sort(byStart))
	for (const event of listed) {
		if (seen.has(event.id) || event.status !== 'approved') continue
		if (Date.parse(event.endsAt) <= now) continue
		seen.add(event.id)
		rows.push({
			key: event.id,
			eventId: event.id,
			event,
			state: rowState(event, now),
			pick: pickFor(event.id),
			editable: canEditStaffPicks(role, event.endsAt, now)
		})
	}

	// Picks on events not listed above (ended, or not approved)
	const others = picks
		.filter((p) => p.eventId && !seen.has(p.eventId))
		.map((pick) => ({ pick, event: pickEvents[pick.eventId as string] ?? null }))
		.sort((a, b) => (a.event && b.event ? byStart(b.event, a.event) : a.event ? -1 : 1))
	for (const { pick, event } of others) {
		const eventId = pick.eventId as string
		if (seen.has(eventId)) continue
		seen.add(eventId)
		rows.push({
			key: eventId,
			eventId,
			event,
			state: rowState(event, now),
			pick,
			// Until the event loads, only editors can tell it's safe to remove
			editable: canEditStaffPicks(role, event ? event.endsAt : new Date(0).toISOString(), now)
		})
	}

	return rows
}

/** Position for a new pick after the existing ones */
export function nextPickPosition(picks: Pick<FeaturedParty, 'position'>[]): number {
	return picks.reduce((max, p) => Math.max(max, p.position + 1), 0)
}

/**
 * What saving the dialog's selection changes: rows to feature the team in
 * (selected, not featured yet) and picks to remove (featured, deselected).
 * Rows the role can't edit never change.
 */
export function pickChanges(
	rows: FeatureRow[],
	selected: ReadonlySet<string>
): { add: FeatureRow[]; remove: FeatureRow[] } {
	const editable = rows.filter((row) => row.editable)
	return {
		add: editable.filter((row) => !row.pick && selected.has(row.key)),
		remove: editable.filter((row) => !!row.pick && !selected.has(row.key))
	}
}

/** The keys of the rows the team is already featured in. */
export function featuredKeys(rows: FeatureRow[]): Set<string> {
	return new Set(rows.filter((row) => row.pick).map((row) => row.key))
}
