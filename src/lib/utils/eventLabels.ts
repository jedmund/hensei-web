/**
 * Localized labels for event kinds and statuses, plus form conversions.
 */

import * as m from '$lib/paraglide/messages'
import {
	ELEMENT_REQUIRED_KINDS,
	EVENT_KINDS,
	EVENT_SERIES,
	type EventKind,
	type EventSeries,
	type EventPayload,
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

const SERIES_LABELS: Record<EventSeries, () => string> = {
	unite_and_fight: m.event_kind_unite_and_fight,
	dread_barrage: m.event_kind_dread_barrage,
	rise_of_the_beasts: m.event_series_rise_of_the_beasts,
	records_of_the_ten: m.event_series_records_of_the_ten
}

/** Series options for a select, with "none" first */
export function eventSeriesOptions(): { value: string; label: string }[] {
	return [
		{ value: '', label: m.event_series_none() },
		...EVENT_SERIES.map((series) => ({ value: series, label: SERIES_LABELS[series]() }))
	]
}

export function eventKindLabel(kind: EventKind): string {
	return KIND_LABELS[kind]?.() ?? kind
}

export function eventKindOptions(): { value: EventKind; label: string }[] {
	return EVENT_KINDS.map((kind) => ({ value: kind, label: eventKindLabel(kind) }))
}

/** Form state for an event (times as JST `datetime-local` values) */
export interface EventFormState {
	nameEn: string
	nameJp: string
	kind: EventKind
	/** '' for none */
	series: EventSeries | ''
	element: number
	startsAt: string
	endsAt: string
	raids: RaidFull[]
	/** Unite and Fight number; 0 for none */
	eventNumber: number
}

export function emptyEventForm(): EventFormState {
	return {
		nameEn: '',
		nameJp: '',
		kind: 'story_event',
		series: '',
		element: 0,
		startsAt: '',
		endsAt: '',
		raids: [],
		eventNumber: 0
	}
}

export function eventToForm(event: GameEvent): EventFormState {
	return {
		nameEn: event.name.en ?? '',
		nameJp: event.name.ja ?? '',
		kind: event.kind,
		series: event.series ?? '',
		element: event.element ?? 0,
		startsAt: isoToJstInput(event.startsAt),
		endsAt: isoToJstInput(event.endsAt),
		raids: [...(event.raids ?? [])],
		eventNumber: event.eventNumber ?? 0
	}
}

/** Whether the kind needs a boss element (Unite and Fight, Dread Barrage) */
export function eventKindNeedsElement(kind: EventKind): boolean {
	return ELEMENT_REQUIRED_KINDS.includes(kind)
}

/**
 * Builds the API payload, or null when it isn't valid yet: no English name,
 * times missing or out of order, a required element missing, or a Unite and
 * Fight without its number (crews look Guild Wars up by number).
 */
export function formToEventPayload(form: EventFormState): EventPayload | null {
	const startsAt = jstInputToIso(form.startsAt)
	const endsAt = jstInputToIso(form.endsAt)
	if (!startsAt || !endsAt || Date.parse(endsAt) <= Date.parse(startsAt)) return null
	if (!form.nameEn.trim()) return null
	if (ELEMENT_REQUIRED_KINDS.includes(form.kind) && form.element <= 0) return null
	if (form.kind === 'unite_and_fight' && form.eventNumber <= 0) return null
	return {
		nameEn: form.nameEn.trim(),
		nameJp: form.nameJp.trim(),
		kind: form.kind,
		series: form.series || null,
		element: form.element > 0 ? form.element : null,
		startsAt,
		endsAt,
		raidIds: form.raids.map((r) => r.id),
		eventNumber: form.kind === 'unite_and_fight' ? Math.trunc(form.eventNumber) : null
	}
}
