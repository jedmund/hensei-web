/**
 * Localized labels for event kinds and statuses, plus form conversions.
 */

import * as m from '$lib/paraglide/messages'
import {
	ELEMENT_REQUIRED_KINDS,
	EVENT_KINDS,
	type EventKind,
	type EventPayload,
	type EventStatus,
	type GameEvent
} from '$lib/types/api/event'
import type { RaidFull } from '$lib/types/api/raid'
import { isoToJstInput, jstInputToIso } from '$lib/utils/jstDateTime'

const KIND_LABELS: Record<EventKind, () => string> = {
	story_event: m.event_kind_story_event,
	rerun: m.event_kind_rerun,
	collab: m.event_kind_collab,
	unite_and_fight: m.event_kind_unite_and_fight,
	dread_barrage: m.event_kind_dread_barrage,
	farming: m.event_kind_farming,
	alchemy: m.event_kind_alchemy,
	other: m.event_kind_other
}

const STATUS_LABELS: Record<EventStatus, () => string> = {
	draft: m.event_status_draft,
	approved: m.event_status_approved,
	hidden: m.event_status_hidden
}

export function eventKindLabel(kind: EventKind): string {
	return KIND_LABELS[kind]?.() ?? kind
}

export function eventStatusLabel(status: EventStatus): string {
	return STATUS_LABELS[status]?.() ?? status
}

export function eventKindOptions(): { value: EventKind; label: string }[] {
	return EVENT_KINDS.map((kind) => ({ value: kind, label: eventKindLabel(kind) }))
}

/** Form state for an event (times as JST `datetime-local` values) */
export interface EventFormState {
	nameEn: string
	nameJp: string
	kind: EventKind
	element: number
	startsAt: string
	endsAt: string
	raids: RaidFull[]
}

export function emptyEventForm(): EventFormState {
	return {
		nameEn: '',
		nameJp: '',
		kind: 'story_event',
		element: 0,
		startsAt: '',
		endsAt: '',
		raids: []
	}
}

export function eventToForm(event: GameEvent): EventFormState {
	return {
		nameEn: event.name.en ?? '',
		nameJp: event.name.ja ?? '',
		kind: event.kind,
		element: event.element ?? 0,
		startsAt: isoToJstInput(event.startsAt),
		endsAt: isoToJstInput(event.endsAt),
		raids: [...(event.raids ?? [])]
	}
}

/** Whether the kind needs a boss element (Unite and Fight, Dread Barrage) */
export function eventKindNeedsElement(kind: EventKind): boolean {
	return ELEMENT_REQUIRED_KINDS.includes(kind)
}

/**
 * Builds the API payload, or null when it isn't valid yet: no English name,
 * times missing or out of order, or a required element missing.
 */
export function formToEventPayload(form: EventFormState): EventPayload | null {
	const startsAt = jstInputToIso(form.startsAt)
	const endsAt = jstInputToIso(form.endsAt)
	if (!startsAt || !endsAt || Date.parse(endsAt) <= Date.parse(startsAt)) return null
	if (!form.nameEn.trim()) return null
	if (ELEMENT_REQUIRED_KINDS.includes(form.kind) && form.element <= 0) return null
	return {
		nameEn: form.nameEn.trim(),
		nameJp: form.nameJp.trim(),
		kind: form.kind,
		element: form.element > 0 ? form.element : null,
		startsAt,
		endsAt,
		raidIds: form.raids.map((r) => r.id)
	}
}
