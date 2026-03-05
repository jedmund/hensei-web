/**
 * Job adapter test fixtures
 *
 * API = what Rails sends (snake_case, from JobBlueprint + SearchController)
 * EXPECTED = what callers receive (camelCase, post-adapter transform)
 */

// What the Rails API returns
export const API = {
	searchSkills: {
		results: [{ id: 'skill-1', name: { en: 'Rage' } }],
		meta: { count: 42, total_pages: 5, per_page: 10 }
	},
	searchSkillsEmpty: {
		results: [],
		meta: { count: 0, total_pages: 1, per_page: 10 }
	},
	searchSkillsNoMeta: {
		results: []
	}
}

// What the adapter returns to callers
export const EXPECTED = {
	searchSkills: {
		results: [{ id: 'skill-1', name: { en: 'Rage' } }],
		total: 42,
		page: 1,
		totalPages: 5,
		meta: { count: 42, page: 1, perPage: 10, totalPages: 5 }
	},
	searchSkillsEmpty: {
		results: [],
		total: 0,
		page: 1,
		totalPages: 1,
		meta: { count: 0, page: 1, perPage: 10, totalPages: 1 }
	},
	searchSkillsNoMeta: {
		results: [],
		total: 0,
		page: 1,
		totalPages: 1,
		meta: undefined
	}
}
