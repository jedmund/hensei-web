/**
 * Accounts, for admins (Database > Admin > Users). Read-only through the
 * generic screens: there's no edit form. The one change admins make, the
 * role, has its own control in the detail (detail/UserRole.svelte) and its
 * own endpoint. Every change is logged and shown under History.
 */
import { queryOptions } from '@tanstack/svelte-query'
import * as m from '$lib/paraglide/messages'
import { adminAdapter } from '$lib/api/adapters/admin.adapter'
import { adminKeys } from '$lib/api/queries/admin.queries'
import { defineResource, type Field } from '$lib/features/database/schema/types'
import { usersSection } from '$lib/features/database/users/section'
import { roleOptions } from '$lib/features/database/users/roles'
import type { AdminUserDetail, AdminUserRow } from '$lib/types/api/admin'
import { formatDateTime } from '$lib/utils/date'
import {
	buildGranblueProfileUrl,
	buildWikiProfileUrl,
	buildYoutubeChannelUrl
} from '$lib/utils/external-links'

const dateTime = (value: string | null | undefined) => (value ? formatDateTime(value) : null)

const CREW_ROLE_LABELS = {
	member: m.crew_role_member,
	vice_captain: m.crew_role_vice_captain,
	captain: m.crew_role_captain
}

/** Collection kinds counted in the detail, with their row labels */
const COLLECTION_KINDS = [
	['characters', m.db_users_field_collection_characters],
	['weapons', m.db_users_field_collection_weapons],
	['summons', m.db_users_field_collection_summons],
	['artifacts', m.db_users_field_collection_artifacts],
	['jobAccessories', m.db_users_field_collection_job_accessories]
] as const

/** A user as the detail holds it: `name` titles the page and the breadcrumb */
export type UserRecord = AdminUserDetail & { name: string }

export const asUserRecord = (user: AdminUserDetail): UserRecord => ({
	...user,
	name: user.displayName || user.username
})

export const usersResource = defineResource<AdminUserRow, UserRecord>({
	name: 'users',
	fields: [
		{ key: 'username', kind: 'text', label: m.db_users_field_username, write: false },
		{
			key: 'display_name',
			kind: 'text',
			label: m.db_users_field_display_name,
			write: false,
			list: { sortable: false }
		},
		// Searchable from the list, but shown in the detail only
		{ key: 'email', kind: 'text', label: m.db_users_field_email, write: false },
		{
			key: 'email_verified',
			kind: 'boolean',
			label: m.db_users_field_email_verified,
			write: false
		},
		{
			key: 'role',
			kind: 'enum',
			label: m.db_users_field_role,
			options: roleOptions,
			write: false,
			filter: { kind: 'multi', facet: true }
		},
		{
			key: 'created_at',
			kind: 'datetime',
			label: m.db_users_field_created_at,
			write: false,
			detail: { value: (u) => dateTime(u.createdAt) }
		},
		// Accounts linked on the profile: columns to turn on, and filters
		{
			key: 'granblue_id',
			kind: 'link',
			label: m.db_users_field_granblue_id,
			read: (u) =>
				u.granblueId === null || u.granblueId === undefined ? null : String(u.granblueId),
			href: (v) => buildGranblueProfileUrl(v),
			showValue: true,
			write: false,
			list: { defaultHidden: true, sortable: false }
		},
		{
			key: 'youtube',
			kind: 'link',
			label: m.db_users_field_youtube,
			href: (v) => buildYoutubeChannelUrl(v),
			showValue: true,
			write: false,
			list: { defaultHidden: true, sortable: false }
		},
		{
			key: 'wiki_profile',
			kind: 'link',
			label: m.db_users_field_wiki_profile,
			href: (v) => buildWikiProfileUrl(v),
			showValue: true,
			write: false,
			list: { defaultHidden: true, sortable: false }
		},
		{
			// Signed-in activity, to within a few minutes
			key: 'last_seen_at',
			kind: 'datetime',
			label: m.db_users_field_last_seen_at,
			write: false,
			detail: { value: (u) => dateTime(u.lastSeenAt), empty: m.db_users_never_seen }
		},
		// Account details: what the user has made and joined (counts only)
		{
			key: 'party_count',
			kind: 'number',
			label: m.db_users_field_party_count,
			int: true,
			write: false
		},
		{
			key: 'crew',
			kind: 'text',
			label: m.db_users_field_crew,
			read: (u) => (u.crew ? `${u.crew.name} (${CREW_ROLE_LABELS[u.crew.role]()})` : null),
			write: false,
			detail: { empty: m.db_detail_not_available }
		},
		{
			key: 'favorites_count',
			kind: 'number',
			label: m.db_users_field_favorites_count,
			int: true,
			write: false
		},
		{
			key: 'favorited_count',
			kind: 'number',
			label: m.db_users_field_favorited_count,
			int: true,
			write: false
		},
		...COLLECTION_KINDS.map(([kind, label]): Field<AdminUserRow, UserRecord> => ({
			key: `collection_${kind}`,
			kind: 'number',
			label,
			int: true,
			read: (u) => u.collection[kind],
			write: false
		})),
		{
			key: 'deletion_scheduled_at',
			kind: 'datetime',
			label: m.db_users_field_deletion_scheduled_at,
			write: false,
			list: { sortable: false },
			detail: { hideWhenEmpty: true, value: (u) => dateTime(u.deletionScheduledAt) }
		},
		{
			// The access log, drawn by the history section
			key: 'history',
			kind: 'custom',
			label: m.db_users_section_history,
			write: false,
			form: false
		}
	],

	list: {
		label: m.db_users_label,
		entity: m.db_users_entity,
		empty: m.db_users_empty,
		title: 'username',
		rowId: (u) => u.id,
		columns: [
			'username',
			'display_name',
			'role',
			'created_at',
			'last_seen_at',
			'deletion_scheduled_at',
			'granblue_id',
			'youtube',
			'wiki_profile'
		],
		filters: [
			'role',
			{
				id: 'status',
				label: m.db_users_filter_status,
				toggles: [{ key: 'deletion_scheduled', label: m.db_users_filter_deletion_scheduled }]
			},
			{
				id: 'linked',
				label: m.db_users_filter_linked,
				toggles: [
					{ key: 'has_granblue_id', label: m.db_users_field_granblue_id },
					{ key: 'has_youtube', label: m.db_users_field_youtube },
					{ key: 'has_wiki_profile', label: m.db_users_field_wiki_profile }
				]
			}
		],
		baseFields: ['username', 'display_name', 'role'],
		defaultSort: [{ id: 'created_at', desc: true }]
	},

	layout: {
		detail: [
			{
				id: 'profile',
				title: m.db_users_section_profile,
				fields: [
					'username',
					'display_name',
					'email',
					'email_verified',
					'created_at',
					'last_seen_at',
					'deletion_scheduled_at'
				]
			},
			{
				id: 'linked',
				title: m.db_users_filter_linked,
				fields: ['granblue_id', 'youtube', 'wiki_profile']
			},
			{
				id: 'details',
				title: m.db_users_section_details,
				fields: [
					'party_count',
					'crew',
					'favorites_count',
					'favorited_count',
					...COLLECTION_KINDS.map(([kind]) => `collection_${kind}`)
				]
			},
			{
				id: 'role',
				title: m.db_users_section_role,
				fields: ['role'],
				component: 'userRole',
				container: false
			},
			{
				id: 'history',
				title: m.db_users_section_history,
				fields: ['history'],
				component: 'userHistory',
				container: false
			}
		],
		edit: []
	},

	record: {
		fetch: (id, options) => adminAdapter.getUser(id, options).then(asUserRecord),
		query: (id) =>
			queryOptions({
				queryKey: adminKeys.user(id),
				queryFn: () => adminAdapter.getUser(id).then(asUserRecord)
			}),
		routeId: (u) => u.id,
		noun: m.db_users_type
	},

	section: usersSection
})
