/**
 * Localized labels and select options for event kinds and series.
 */

import * as m from '$lib/paraglide/messages'
import { EVENT_KINDS, EVENT_SERIES, type EventKind, type EventSeries } from '$lib/types/api/event'

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
