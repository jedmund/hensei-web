export type EventType =
	| 'unite_and_fight'
	| 'rise_of_the_beasts'
	| 'tales_of_arcarum'
	| 'records_of_the_ten'
	| 'exo_crucible'
	| 'scenario_event'
	| 'collab_event'
	| 'dread_barrage'
	| 'scenario_rerun'
	| 'tower_of_babyl'

export interface GameEvent {
	id: string
	name: string
	slug: string
	eventType: EventType
	startTime: string
	endTime: string
	element?: number | null
	bannerImage?: string | null
	status: 'current' | 'upcoming' | 'past'
	createdAt: string
	updatedAt: string
}

export interface CreateEventInput {
	name: string
	slug?: string
	event_type: string
	start_time: string
	end_time: string
	element?: number | null
}

export interface UpdateEventInput {
	name?: string
	slug?: string
	event_type?: string
	start_time?: string
	end_time?: string
	element?: number | null
}
