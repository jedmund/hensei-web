// Game event types based on the community participation API contract.
// Named GameEvent to avoid clashing with the DOM's Event.

import type { LocalizedName } from './entities'
import type { RaidFull } from './raid'

export const EVENT_KINDS = [
	'story_event',
	'rerun',
	'collab',
	'unite_and_fight',
	'dread_barrage',
	'farming',
	'alchemy',
	'other'
] as const

/** Kinds whose boss element must be set */
export const ELEMENT_REQUIRED_KINDS: readonly EventKind[] = ['unite_and_fight', 'dread_barrage']
export type EventKind = (typeof EVENT_KINDS)[number]

export const EVENT_STATUSES = ['draft', 'approved', 'hidden'] as const
export type EventStatus = (typeof EVENT_STATUSES)[number]

export type EventScope = 'current' | 'upcoming' | 'past'

/** An event from EventBlueprint */
export interface GameEvent {
	id: string
	name: LocalizedName
	kind: EventKind
	/** The boss's element id (same values as a party's element), or null */
	element: number | null
	/** The element players should bring against this boss, from the API; or null */
	advantageElement?: number | null
	/** ISO 8601 timestamps */
	startsAt: string
	endsAt: string
	status: EventStatus
	imageUrl: string | null
	raids: RaidFull[]
	// Editor-only fields
	eventNumber?: number | null
	sourceRefs?: unknown
	sourcePayload?: unknown
}

/** Editor create/update payload */
export interface EventPayload {
	nameEn: string
	nameJp: string
	kind: EventKind
	element: number | null
	startsAt: string
	endsAt: string
	raidIds: string[]
}

export interface ListEventsParams {
	scope?: EventScope
	kind?: EventKind
	/** Editors only */
	status?: EventStatus | 'all'
}
