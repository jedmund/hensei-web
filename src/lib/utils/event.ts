import * as m from '$lib/paraglide/messages'
import type { EventType } from '$lib/types/api/event'

export function getEventTypeLabel(type: EventType | string): string {
	switch (type) {
		case 'unite_and_fight':
			return m.event_type_unite_and_fight()
		case 'rise_of_the_beasts':
			return m.event_type_rise_of_the_beasts()
		case 'tales_of_arcarum':
			return m.event_type_tales_of_arcarum()
		case 'records_of_the_ten':
			return m.event_type_records_of_the_ten()
		case 'exo_crucible':
			return m.event_type_exo_crucible()
		case 'scenario_event':
			return m.event_type_scenario_event()
		case 'collab_event':
			return m.event_type_collab_event()
		case 'dread_barrage':
			return m.event_type_dread_barrage()
		case 'scenario_rerun':
			return m.event_type_scenario_rerun()
		case 'tower_of_babyl':
			return m.event_type_tower_of_babyl()
		default:
			return type
	}
}

export function getEventTypeOptions(): Array<{ value: string; label: string }> {
	const types: EventType[] = [
		'unite_and_fight',
		'rise_of_the_beasts',
		'tales_of_arcarum',
		'records_of_the_ten',
		'exo_crucible',
		'scenario_event',
		'collab_event',
		'dread_barrage',
		'scenario_rerun',
		'tower_of_babyl'
	]
	return types.map((t) => ({ value: t, label: getEventTypeLabel(t) }))
}

export function getEventStatusLabel(status: string): string {
	switch (status) {
		case 'current':
			return m.event_status_current()
		case 'upcoming':
			return m.event_status_upcoming()
		case 'past':
			return m.event_status_past()
		default:
			return status
	}
}
