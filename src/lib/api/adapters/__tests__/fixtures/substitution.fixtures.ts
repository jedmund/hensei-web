/**
 * Substitution adapter test fixtures
 *
 * REQUEST = the JSON envelope the adapter sends (snake_case after transformRequest).
 * Substitution endpoints don't have a typical resource-show response — the
 * adapter mainly exercises envelope shape on create/update/delete/reorder.
 */

export const REQUEST = {
	create: {
		substitution: {
			party_id: 'p1',
			grid_type: 'GridWeapon',
			grid_id: 'g1',
			item_id: 'i1',
			position: 0
		}
	},
	update: {
		substitution: { party_id: 'p1', position: 3 }
	},
	destroy: {
		substitution: { party_id: 'p1' }
	},
	reorder: {
		party_id: 'p1',
		substitutions: [
			{ id: 's1', position: 0 },
			{ id: 's2', position: 1 }
		]
	}
} as const

export const PARAMS = {
	create: {
		partyId: 'p1',
		gridType: 'GridWeapon',
		gridId: 'g1',
		itemId: 'i1',
		position: 0
	},
	update: { partyId: 'p1', position: 3 },
	reorderEntries: [
		{ id: 's1', position: 0 },
		{ id: 's2', position: 1 }
	]
}
