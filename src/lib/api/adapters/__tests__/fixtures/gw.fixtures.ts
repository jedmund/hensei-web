/**
 * GW (Guild War) adapter test fixtures
 *
 * API = what Rails sends (snake_case, from GwEventBlueprint + CrewGwParticipationBlueprint)
 * EXPECTED = what callers receive (camelCase, post-adapter transform)
 */

// What the Rails API returns
export const API = {
	getEvents: {
		gw_events: [{ id: 'gw-1', event_number: 78 }]
	},
	getEvent: {
		gw_event: { id: 'gw-1', event_number: 78 }
	},
	createEvent: {
		gw_event: { id: 'gw-new' }
	},
	getEventWithParticipation: {
		gw_event: { id: 'gw-1' },
		crew_gw_participation: { id: 'part-1' },
		members_during_event: [{ id: 'm1', retired: false }],
		phantom_players: [{ id: 'p1', name: 'Ghost', retired: true }]
	},
	getEventWithParticipationEmpty: {
		gw_event: null,
		crew_gw_participation: null
		// members_during_event and phantom_players missing
	},
	joinEvent: {
		participation: { id: 'part-1' }
	},
	getParticipation: {
		crew_gw_participation: { id: 'part-1', crew_scores: [] }
	},
	addIndividualScore: {
		individual_score: { id: 'is-1' }
	},
	batchAddIndividualScores: {
		individual_scores: [{ id: 'is-1' }]
	},
	addCrewScore: {
		crew_score: { id: 'cs-1' }
	}
}

// What the adapter returns to callers
export const EXPECTED = {
	getEvents: [{ id: 'gw-1', eventNumber: 78 }],
	getEvent: { id: 'gw-1', eventNumber: 78 },
	createEvent: { id: 'gw-new' },
	getEventWithParticipation: {
		gwEvent: { id: 'gw-1' },
		participation: { id: 'part-1' },
		membersDuringEvent: [{ id: 'm1', retired: false }],
		phantomPlayers: [{ id: 'p1', name: 'Ghost', retired: true }]
	},
	getEventWithParticipationEmpty: {
		gwEvent: null,
		participation: null,
		membersDuringEvent: [],
		phantomPlayers: []
	},
	joinEvent: { id: 'part-1' },
	getParticipation: { id: 'part-1', crewScores: [] }
}
