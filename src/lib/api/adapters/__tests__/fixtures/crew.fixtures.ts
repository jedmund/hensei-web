/**
 * Crew adapter test fixtures
 *
 * API = what Rails sends (snake_case, from CrewBlueprint + PhantomPlayerBlueprint)
 * EXPECTED = what callers receive (camelCase, post-adapter transform)
 */

// What the Rails API returns
export const API = {
	getMyCrew: {
		crew: { id: 'crew-1', name: 'Test Crew' }
	},
	getSharedParties: {
		parties: [{ id: 'p1' }],
		meta: { page: 2, total_pages: 3, count: 50, per_page: 20 }
	},
	getMembers: {
		members: [],
		phantom_players: []
	},
	getRoster: {
		members: []
	},
	transferCaptain: {
		crew: { id: 'crew-1' }
	},
	sendInvitation: {
		invitation: { id: 'inv-1', status: 'pending' }
	},
	acceptInvitation: {
		membership: { id: 'mem-1' }
	},
	createPhantom: {
		phantom_player: { id: 'p1', name: 'Ghost' }
	},
	bulkCreatePhantoms: {
		phantom_players: [{ id: 'p1' }, { id: 'p2' }]
	},
	declinePhantomClaim: {
		phantom_player: { id: 'p1' }
	},
	getPendingPhantomClaims: {
		phantom_claims: [{ id: 'p1', name: 'Ghost' }]
	}
}

// What the adapter returns to callers
export const EXPECTED = {
	getMyCrew: { id: 'crew-1', name: 'Test Crew' },
	sendInvitation: { id: 'inv-1', status: 'pending' },
	createPhantom: { id: 'p1', name: 'Ghost' },
	bulkCreatePhantoms: [{ id: 'p1' }, { id: 'p2' }],
	getPendingPhantomClaims: [{ id: 'p1', name: 'Ghost' }]
}
