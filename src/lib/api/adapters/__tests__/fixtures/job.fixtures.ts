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
	},
	searchJobs: {
		results: [
			{
				id: 'job-1',
				granblue_id: '140001',
				name: { en: 'Berserker', ja: 'ベルセルク' },
				row: '4',
				order: 1,
				proficiency: [1, 4],
				master_level: true,
				ultimate_mastery: false
			}
		],
		meta: { count: 51, total_pages: 2, per_page: 50 }
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
	},
	searchJobs: {
		results: [
			{
				id: 'job-1',
				granblueId: '140001',
				name: { en: 'Berserker', ja: 'ベルセルク' },
				row: '4',
				order: 1,
				proficiency: [1, 4],
				masterLevel: true,
				ultimateMastery: false
			}
		],
		page: 2,
		total: 51,
		totalPages: 2
	}
}
