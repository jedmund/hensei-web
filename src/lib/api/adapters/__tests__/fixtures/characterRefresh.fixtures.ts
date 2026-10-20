/**
 * Contract C6 example responses (snake_case, as the API emits them).
 * Copied from lanes/board/fixtures/refresh/ (D11, D13). `reparseApplied.character`
 * is a placeholder there; tests substitute a character.
 */

export const API = {
	reparsePreviewChanges: {
		refresh: {
			preview_token: 'pv_8f2c1d0e4b7a',
			written: false,
			wiki_changed: true,
			wiki_jp_changed: false,
			fetched_at: '2026-10-20T12:00:00Z',
			counts: {
				slots_created: 0,
				slots_deleted: 0,
				versions_created: 1,
				versions_updated: 3,
				versions_deleted: 0,
				effects_created: 4,
				effects_updated: 1,
				effects_deleted: 2,
				links_created: 1,
				links_deleted: 0
			},
			changes: [
				{
					kind: 'ability',
					position: 1,
					ordinal: 1,
					name: { en: 'Jinx of the Tiger', ja: '虎の呪い' },
					change: 'updated',
					fields: ['description_en', 'description_jp', 'effects']
				},
				{
					kind: 'ability',
					position: 2,
					ordinal: 1,
					name: { en: "Tiger's Wrath", ja: null },
					change: 'updated',
					fields: ['cooldown']
				},
				{
					kind: 'ability',
					position: 3,
					ordinal: 2,
					name: { en: "Tiger's Roar", ja: null },
					change: 'created',
					fields: []
				},
				{
					kind: 'support',
					position: 1,
					ordinal: 1,
					name: { en: 'Lucky Cat', ja: '招き猫' },
					change: 'updated',
					fields: ['description_en']
				}
			],
			icon_fallbacks: [
				{ kind: 'ability', position: 3, ordinal: 2, name: { en: "Tiger's Roar", ja: null } }
			]
		},
		character: null
	},
	reparsePreviewNoChanges: {
		refresh: {
			preview_token: 'pv_0a9b8c7d6e5f',
			written: false,
			wiki_changed: false,
			wiki_jp_changed: null,
			fetched_at: '2026-10-20T12:05:00Z',
			counts: {
				slots_created: 0,
				slots_deleted: 0,
				versions_created: 0,
				versions_updated: 0,
				versions_deleted: 0,
				effects_created: 0,
				effects_updated: 0,
				effects_deleted: 0,
				links_created: 0,
				links_deleted: 0
			},
			changes: [],
			icon_fallbacks: []
		},
		character: null
	},
	reparseApplied: {
		refresh: {
			preview_token: null,
			written: true,
			wiki_changed: true,
			wiki_jp_changed: false,
			fetched_at: '2026-10-20T12:00:00Z',
			counts: {
				slots_created: 0,
				slots_deleted: 0,
				versions_created: 1,
				versions_updated: 3,
				versions_deleted: 0,
				effects_created: 4,
				effects_updated: 1,
				effects_deleted: 2,
				links_created: 1,
				links_deleted: 0
			},
			changes: [],
			icon_fallbacks: []
		},
		character:
			'<the :full CharacterBlueprint render; use an existing character fixture in hensei-svelte tests>'
	},
	reparseExpiredToken: {
		status: 422,
		body: {
			error: 'preview_expired',
			message: 'This preview has expired. Preview again to refresh.'
		}
	},
	batchCreated: { status: 202, body: { id: 'rf_3c4d5e6f7a8b' } },
	batchRunning: {
		id: 'rf_3c4d5e6f7a8b',
		status: 'running',
		refetch_jp: false,
		created_at: '2026-10-20T12:10:00Z',
		items: [
			{
				character_id: '0b6f1d2e-0000-4000-8000-000000000001',
				granblue_id: '3040377000',
				style_swap: false,
				name: { en: 'Cidala', ja: 'シダラ' },
				style_name: null,
				status: 'previewed',
				error: null,
				refresh: {
					preview_token: null,
					written: false,
					wiki_changed: true,
					wiki_jp_changed: null,
					fetched_at: '2026-10-20T12:10:02Z',
					counts: {
						slots_created: 0,
						slots_deleted: 0,
						versions_created: 0,
						versions_updated: 2,
						versions_deleted: 0,
						effects_created: 1,
						effects_updated: 0,
						effects_deleted: 1,
						links_created: 0,
						links_deleted: 0
					},
					changes: [
						{
							kind: 'ability',
							position: 2,
							ordinal: 1,
							name: { en: "Tiger's Wrath", ja: null },
							change: 'updated',
							fields: ['cooldown']
						}
					],
					icon_fallbacks: []
				}
			},
			{
				character_id: '0b6f1d2e-0000-4000-8000-000000000002',
				granblue_id: '3040377000',
				style_swap: true,
				name: { en: 'Cidala', ja: 'シダラ' },
				style_name: { en: 'Super Cidala', ja: null },
				status: 'fetching',
				error: null,
				refresh: null
			},
			{
				character_id: '0b6f1d2e-0000-4000-8000-000000000003',
				granblue_id: '3040101000',
				style_swap: false,
				name: { en: 'Lecia', ja: 'リーシャ' },
				style_name: null,
				status: 'queued',
				error: null,
				refresh: null
			}
		]
	},
	batchPreviewed: {
		id: 'rf_3c4d5e6f7a8b',
		status: 'previewed',
		refetch_jp: false,
		created_at: '2026-10-20T12:10:00Z',
		items: [
			{
				character_id: '0b6f1d2e-0000-4000-8000-000000000001',
				granblue_id: '3040377000',
				style_swap: false,
				name: { en: 'Cidala', ja: 'シダラ' },
				style_name: null,
				status: 'previewed',
				error: null,
				refresh: {
					preview_token: null,
					written: false,
					wiki_changed: true,
					wiki_jp_changed: null,
					fetched_at: '2026-10-20T12:10:02Z',
					counts: {
						slots_created: 0,
						slots_deleted: 0,
						versions_created: 0,
						versions_updated: 2,
						versions_deleted: 0,
						effects_created: 1,
						effects_updated: 0,
						effects_deleted: 1,
						links_created: 0,
						links_deleted: 0
					},
					changes: [
						{
							kind: 'ability',
							position: 2,
							ordinal: 1,
							name: { en: "Tiger's Wrath", ja: null },
							change: 'updated',
							fields: ['cooldown']
						}
					],
					icon_fallbacks: []
				}
			},
			{
				character_id: '0b6f1d2e-0000-4000-8000-000000000002',
				granblue_id: '3040377000',
				style_swap: true,
				name: { en: 'Cidala', ja: 'シダラ' },
				style_name: { en: 'Super Cidala', ja: null },
				status: 'previewed',
				error: null,
				refresh: {
					preview_token: null,
					written: false,
					wiki_changed: false,
					wiki_jp_changed: null,
					fetched_at: '2026-10-20T12:10:04Z',
					counts: {
						slots_created: 0,
						slots_deleted: 0,
						versions_created: 0,
						versions_updated: 0,
						versions_deleted: 0,
						effects_created: 0,
						effects_updated: 0,
						effects_deleted: 0,
						links_created: 0,
						links_deleted: 0
					},
					changes: [],
					icon_fallbacks: []
				}
			},
			{
				character_id: '0b6f1d2e-0000-4000-8000-000000000003',
				granblue_id: '3040101000',
				style_swap: false,
				name: { en: 'Lecia', ja: 'リーシャ' },
				style_name: null,
				status: 'failed',
				error: 'The wiki page Lecia could not be fetched (502)',
				refresh: null
			}
		]
	},
	batchApplied: {
		id: 'rf_3c4d5e6f7a8b',
		status: 'applied',
		refetch_jp: false,
		created_at: '2026-10-20T12:10:00Z',
		items: [
			{
				character_id: '0b6f1d2e-0000-4000-8000-000000000001',
				granblue_id: '3040377000',
				style_swap: false,
				name: { en: 'Cidala', ja: 'シダラ' },
				style_name: null,
				status: 'applied',
				error: null,
				refresh: null
			},
			{
				character_id: '0b6f1d2e-0000-4000-8000-000000000002',
				granblue_id: '3040377000',
				style_swap: true,
				name: { en: 'Cidala', ja: 'シダラ' },
				style_name: { en: 'Super Cidala', ja: null },
				status: 'skipped',
				error: null,
				refresh: null
			},
			{
				character_id: '0b6f1d2e-0000-4000-8000-000000000003',
				granblue_id: '3040101000',
				style_swap: false,
				name: { en: 'Lecia', ja: 'リーシャ' },
				style_name: null,
				status: 'failed',
				error: 'The wiki page Lecia could not be fetched (502)',
				refresh: null
			}
		]
	}
}
