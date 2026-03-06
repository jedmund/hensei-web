/**
 * Collection adapter test fixtures
 *
 * API = what Rails sends (snake_case, from CollectionBlueprints)
 * EXPECTED = what callers receive (camelCase, post-adapter transform)
 */

import { apiMeta } from './helpers'

// What the Rails API returns
export const API = {
	listCharacters: {
		characters: [{ id: 'cc-1', character: { id: 'c1' } }],
		meta: apiMeta()
	},
	listWeapons: {
		weapons: [{ id: 'cw-1' }],
		meta: apiMeta()
	},
	listWeaponsAlt: {
		collection_weapons: [{ id: 'cw-2' }],
		meta: apiMeta()
	},
	listSummons: {
		summons: [{ id: 'cs-1' }],
		meta: apiMeta()
	},
	listSummonsAlt: {
		collection_summons: [{ id: 'cs-2' }],
		meta: apiMeta()
	},
	listJobAccessories: {
		job_accessories: [{ id: 'ja-1', name: 'Shield' }]
	},
	collectedCharactersSinglePage: {
		characters: [{ character: { id: 'c1' } }, { character: { id: 'c2' } }],
		meta: apiMeta({ count: 2, per_page: 100 })
	},
	collectedCharactersPage1: {
		characters: [{ character: { id: 'c1' } }, { character: { id: 'c2' } }],
		meta: apiMeta({ count: 4, total_pages: 2, per_page: 2 })
	},
	collectedCharactersPage2: {
		characters: [{ character: { id: 'c3' } }, { character: { id: 'c4' } }],
		meta: apiMeta({ count: 4, total_pages: 2, per_page: 2, current_page: 2 })
	}
}

// What the adapter returns to callers
export const EXPECTED = {
	listCharacters: {
		results: [{ id: 'cc-1', character: { id: 'c1' } }],
		page: 1,
		total: 1,
		totalPages: 1,
		perPage: 20
	},
	listWeapons: { results: [{ id: 'cw-1' }] },
	listWeaponsAlt: { results: [{ id: 'cw-2' }] },
	listSummons: { results: [{ id: 'cs-1' }] },
	listSummonsAlt: { results: [{ id: 'cs-2' }] },
	listJobAccessories: [{ id: 'ja-1', name: 'Shield' }],
	collectedCharacterIdsSinglePage: ['c1', 'c2'],
	collectedCharacterIdsMultiPage: ['c1', 'c2', 'c3', 'c4']
}
