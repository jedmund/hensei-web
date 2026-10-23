/**
 * Difficulty adapter test fixtures
 *
 * API = what Rails sends (snake_case, raw blueprint output)
 * EXPECTED = what callers receive (camelCase, post-adapter transform)
 */

export const API = {
	tier: {
		id: 'tier-uuid-1',
		slug: 'casual',
		name: 'Casual',
		color: '#86C5A8',
		sort_order: 10,
		description: 'Easy parties',
		min_score: 0,
		max_score: 40,
		image_key: 'images/difficulties/tier-uuid-1.png'
	},
	tierList: [
		{ id: 'tier-uuid-1', slug: 'casual', name: 'Casual', sort_order: 10 },
		{ id: 'tier-uuid-2', slug: 'mid', name: 'Mid', sort_order: 20 }
	],
	tierListWithDrafts: [
		{ id: 'tier-uuid-1', slug: 'casual', name: 'Casual', sort_order: 10 },
		{
			id: 'draft-tier-1',
			slug: 'endgame',
			name: 'Endgame',
			sort_order: 30,
			pending: true,
			pending_operation: 'create',
			draft_id: 'draft-uuid-1'
		}
	],
	component: {
		id: 'comp-uuid-1',
		name: 'weapon',
		weight: 1,
		enabled: true,
		min_count_to_score: 4,
		target_max: 100
	},
	componentList: [
		{ id: 'comp-uuid-1', name: 'weapon', weight: 1, enabled: true, min_count_to_score: 4 }
	],
	rule: {
		id: 'rule-uuid-1',
		name: 'Grand series weapon present',
		component: 'weapon',
		rule_type: 'series_present',
		params: { series_id: 9, min_count: 1 },
		weight: 5,
		active: true
	},
	ruleList: [
		{
			id: 'rule-uuid-1',
			name: 'Grand series',
			component: 'weapon',
			rule_type: 'series_present',
			params: { min_count: 1 },
			weight: 5,
			active: true
		}
	],
	ruleTypes: {
		types: ['series_present', 'rarity_min', 'awakening_level_min'],
		grouped: {
			weapon: ['series_present', 'rarity_min'],
			character: ['awakening_level_min']
		}
	},
	preview: {
		shortcode: 'qRf1iR',
		scoreable: true,
		score: 72.5,
		tier: { id: 'tier-uuid-2', slug: 'mid', name: 'Mid' },
		breakdown: {
			components: [
				{
					name: 'weapon',
					weight: 1,
					present: true,
					raw_score: 0.8,
					weighted_score: 0.8,
					contribution_sum: 16,
					max_weight: 20,
					target_max: null,
					fired: []
				}
			]
		},
		ruleset_version: 7
	},
	previewUnscoreable: {
		shortcode: 'qRf1iR',
		scoreable: false,
		score: null,
		tier: null,
		breakdown: null,
		ruleset_version: 7
	},
	createTierDraft: {
		draft: {
			id: 'draft-uuid-1',
			target_type: 'Difficulty',
			target_id: null,
			operation: 'create',
			attributes: { slug: 'endgame', name: 'Endgame' }
		}
	},
	listDrafts: {
		drafts: [
			{
				id: 'draft-uuid-1',
				target_type: 'Difficulty',
				target_id: null,
				operation: 'create',
				attributes: { slug: 'endgame' }
			}
		],
		pending_count: 1
	},
	getDiff: {
		diff: {
			tiers: { creates: [], updates: [], destroys: [] },
			rules: { creates: [], updates: [], destroys: [] },
			components: { creates: [], updates: [], destroys: [] }
		},
		pending_count: 0
	},
	commit: {
		ruleset_version_after: 8,
		committed_at: '2026-05-11T00:00:00Z',
		note: 'tune weapon weights',
		change_log_id: 'log-uuid-1'
	},
	discard: { discarded: 3 },
	uploadDraftImage: {
		id: 'draft-uuid-1',
		target_type: 'Difficulty',
		target_id: null,
		operation: 'create',
		attributes: { image_key: 'images/difficulties/_drafts/foo.png' }
	}
}

export const EXPECTED = {
	tier: {
		id: 'tier-uuid-1',
		slug: 'casual',
		name: 'Casual',
		color: '#86C5A8',
		sortOrder: 10,
		description: 'Easy parties',
		minScore: 0,
		maxScore: 40,
		imageKey: 'images/difficulties/tier-uuid-1.png'
	},
	pendingTier: {
		id: 'draft-tier-1',
		slug: 'endgame',
		name: 'Endgame',
		sortOrder: 30,
		pending: true,
		pendingOperation: 'create',
		draftId: 'draft-uuid-1'
	},
	component: {
		id: 'comp-uuid-1',
		name: 'weapon',
		weight: 1,
		enabled: true,
		minCountToScore: 4,
		targetMax: 100
	},
	rule: {
		// params keeps snake_case keys per DATA_MAP_KEYS in transforms.ts
		id: 'rule-uuid-1',
		name: 'Grand series weapon present',
		component: 'weapon',
		ruleType: 'series_present',
		params: { series_id: 9, min_count: 1 },
		weight: 5,
		active: true
	},
	preview: {
		score: 72.5,
		rulesetVersion: 7,
		scoreable: true
	},
	commit: {
		rulesetVersionAfter: 8,
		committedAt: '2026-05-11T00:00:00Z',
		note: 'tune weapon weights',
		changeLogId: 'log-uuid-1'
	}
}
