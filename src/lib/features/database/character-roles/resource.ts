/**
 * The character roles resource (GBF-143): the tags (Attacker, Healer...)
 * editors give characters in a party, described once. A short hand-ordered
 * list, so it uses the ordered list: drag or key a row to change the order
 * the party sidebar offers them in. The edit form uploads the icon.
 */
import * as m from '$lib/paraglide/messages'
import { roleAdapter, type RolePayload } from '$lib/api/adapters/role.adapter'
import { roleKeys } from '$lib/api/queries/role.queries'
import RoleIconCell from '$lib/features/database/character-roles/cells/RoleIconCell.svelte'
import {
	fetchRoleRecord,
	roleRecordQuery,
	toRoleRecord,
	type RoleRecord
} from '$lib/features/database/character-roles/record'
import { characterRolesSection } from '$lib/features/database/character-roles/section'
import { defineResource } from '$lib/features/database/schema/types'
import type { AdminCharacterRoleRow } from '$lib/types/api/admin'
import { buildEntityIconUrl } from '$lib/utils/entityIcon'

export const characterRolesResource = defineResource<AdminCharacterRoleRow, RoleRecord>({
	name: 'character-roles',
	fields: [
		{
			key: 'name',
			kind: 'localized',
			label: m.db_roles_col_name,
			keys: { en: 'name_en', ja: 'name_jp' },
			labels: { en: m.roles_field_name_en, ja: m.roles_field_name_jp },
			read: (r) => r.name,
			required: true
		},
		{
			key: 'sort_order',
			kind: 'number',
			int: true,
			min: 0,
			label: m.roles_field_sort_order,
			// Set by reordering the list; a new role goes last
			write: false
		},
		{
			key: 'icon',
			kind: 'custom',
			label: m.roles_section_icon,
			read: (r) => r.iconKey,
			write: false,
			// The header shows it; uploads need the saved role
			detail: false,
			form: { create: false },
			render: { input: 'roleIcon' }
		}
	],

	list: {
		label: m.nav_roles,
		entity: m.db_roles_entity,
		empty: m.roles_empty,
		title: 'name',
		rowId: (r) => r.id,
		columns: [],
		filters: [],
		baseFields: ['name_en', 'name_jp', 'sort_order', 'icon_key'],
		defaultSort: [
			{ id: 'sort_order', desc: false },
			{ id: 'name_en', desc: false }
		],
		ordered: {
			field: 'sort_order',
			// Positions from 1, as roles have always been numbered
			reorder: (rows) =>
				roleAdapter.reorderRoles(rows.map((r, i) => ({ id: r.id, sortOrder: i + 1 }))),
			thumbnail: RoleIconCell,
			subtitle: (r) => [r.nameJp],
			// The party sidebar's role picker reads the public list
			invalidates: () => [roleKeys.all]
		}
	},

	layout: {
		detail: [{ id: 'details', title: m.roles_section_basics, fields: ['name', 'sort_order'] }],
		edit: [{ id: 'details', title: m.roles_section_basics, fields: ['name', 'icon'] }]
	},

	record: {
		fetch: fetchRoleRecord,
		query: roleRecordQuery,
		routeId: (r) => r.id,
		noun: m.db_roles_noun,
		image: (r) => buildEntityIconUrl(r.iconKey) ?? ''
	},

	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (r, payload) =>
			roleAdapter.updateRole(r.id, payload as Partial<RolePayload>).then(toRoleRecord),
		create: (payload) =>
			roleAdapter.createRole(payload as unknown as RolePayload).then(toRoleRecord),
		// Removes the role from every character it tags, as the old edit page did
		destroy: (r) => roleAdapter.deleteRole(r.id),
		invalidates: () => [roleKeys.all]
	},

	section: characterRolesSection
})
