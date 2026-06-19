/**
 * Role adapter test fixtures
 *
 * API = what Rails sends (snake_case, raw blueprint output)
 * EXPECTED = what callers receive (camelCase, post-adapter transform)
 * REQUEST = the JSON envelope the adapter sends (snake_case after transformRequest)
 */

export const API = {
	role: {
		id: 'role-uuid-1',
		name_en: 'Attacker',
		name_jp: 'アタッカー',
		sort_order: 10,
		icon_key: 'roles/role-uuid-1.png'
	},
	roleList: [
		{ id: 'role-uuid-1', name_en: 'Attacker', sort_order: 10 },
		{ id: 'role-uuid-2', name_en: 'Healer', sort_order: 20 }
	],
	createdRole: { id: 'role-uuid-new', name_en: 'Buffer' },
	uploadResult: { id: 'role-uuid-1', icon_key: 'roles/role-uuid-1.png' }
} as const

export const EXPECTED = {
	role: {
		id: 'role-uuid-1',
		nameEn: 'Attacker',
		nameJp: 'アタッカー',
		sortOrder: 10,
		iconKey: 'roles/role-uuid-1.png'
	},
	createdRole: { id: 'role-uuid-new', nameEn: 'Buffer' }
} as const

export const REQUEST = {
	createPayload: { grid_character_role: { name_en: 'Healer', name_jp: 'ヒーラー' } },
	updatePayload: { grid_character_role: { name_en: 'Buffer' } },
	reorderPayload: {
		roles: [
			{ id: 'a', sort_order: 0 },
			{ id: 'b', sort_order: 1 }
		]
	},
	uploadPayload: { image: 'BASE64DATA', filename: 'icon.png' }
} as const
