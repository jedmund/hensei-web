/**
 * The raid groups resource: the groups the raid list is ordered and filtered
 * by, described once (GBF-143). Nested under Raids in the sidebar; it used to
 * be the raids list's `?view=groups` tab. A group's route id is its id.
 */
import * as m from '$lib/paraglide/messages'
import { raidAdapter } from '$lib/api/adapters/raid.adapter'
import { raidQueries } from '$lib/api/queries/raid.queries'
import type { FlagValue } from '$lib/components/data-table/types'
import { raidGroupsSection } from '$lib/features/database/raid-groups/section'
import { defineResource, type EnumOption } from '$lib/features/database/schema/types'
import { getRaidImage } from '$lib/utils/images/raids'
import { getSectionOptions } from '$lib/utils/raidSection'
import type { AdminRaidGroupRow } from '$lib/types/api/admin'
import type { CreateRaidGroupInput, RaidGroupFull, UpdateRaidGroupInput } from '$lib/types/api/raid'

const sectionOptions = (): EnumOption[] => getSectionOptions()

/** The group's flags as list chips, in the detail's order */
function flags(g: AdminRaidGroupRow): FlagValue[] {
	const out: FlagValue[] = []
	if (g.hl) out.push({ label: m.db_raid_groups_field_hl() })
	if (g.extra) out.push({ label: m.db_raid_groups_field_extra(), tone: 'extra' })
	if (g.guidebooks) out.push({ label: m.db_raid_groups_field_guidebooks() })
	if (g.unlimited) out.push({ label: m.db_raid_groups_field_unlimited() })
	if (g.supportSummon === false) out.push({ label: m.db_raid_groups_flag_no_support_summon() })
	return out
}

export const raidGroupsResource = defineResource<AdminRaidGroupRow, RaidGroupFull>({
	name: 'raid-groups',
	fields: [
		// Group details
		{
			key: 'name',
			kind: 'localized',
			label: m.db_raid_groups_col_name,
			keys: { en: 'name_en', ja: 'name_jp' },
			labels: { en: m.db_raid_groups_field_name_en, ja: m.db_raid_groups_field_name_ja },
			required: true,
			list: { primary: true, minWidth: '220px' }
		},
		{
			key: 'section',
			kind: 'enum',
			label: m.db_raid_groups_field_section,
			options: sectionOptions,
			default: 1,
			required: true,
			list: { width: '112px' },
			filter: { kind: 'multi', facet: true }
		},
		{
			key: 'order',
			kind: 'number',
			label: m.db_raid_groups_field_order,
			sublabel: m.db_raid_groups_hint_order,
			detail: { sublabel: false },
			int: true,
			min: 0,
			default: 0,
			required: true,
			list: { width: '88px' }
		},
		{
			key: 'difficulty',
			kind: 'number',
			label: m.db_raid_groups_field_difficulty,
			int: true,
			min: 0,
			default: 1,
			list: { width: '104px' }
		},
		// Flags
		{
			key: 'hl',
			kind: 'boolean',
			label: m.db_raid_groups_field_hl,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'extra',
			kind: 'boolean',
			label: m.db_raid_groups_field_extra,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'guidebooks',
			kind: 'boolean',
			label: m.db_raid_groups_field_guidebooks,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'unlimited',
			kind: 'boolean',
			label: m.db_raid_groups_field_unlimited,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'support_summon',
			kind: 'boolean',
			label: m.db_raid_groups_field_support_summon,
			sublabel: m.db_raid_groups_hint_support_summon,
			detail: { sublabel: false },
			// Most content takes one; only single-player content (Arcarum) doesn't
			default: true,
			list: { sortable: false, defaultHidden: true }
		},
		// Its raids: the list counts them, the detail lists them
		{
			key: 'raids',
			kind: 'custom',
			label: m.db_raid_groups_section_raids,
			write: false,
			detail: { hideWhenEmpty: true }
		},
		{
			key: 'player_counts',
			kind: 'text',
			label: m.db_raid_groups_col_players,
			write: false,
			detail: false,
			list: {
				value: (g) => (g.playerCounts?.length ? g.playerCounts.join(', ') : null),
				sortable: false,
				width: '104px'
			}
		},
		{
			key: 'raid_count',
			kind: 'number',
			label: m.db_raid_groups_col_raids,
			write: false,
			detail: false,
			list: { sortable: false, width: '88px' }
		},
		// List only
		{
			key: 'updated_at',
			kind: 'datetime',
			label: m.db_col_updated_at,
			write: false,
			detail: false,
			list: { defaultHidden: true }
		}
	],

	list: {
		label: m.db_raid_groups_label,
		entity: m.db_raid_groups_entity,
		empty: m.db_raid_groups_empty,
		title: 'name',
		rowId: (g) => g.id,
		columns: [
			'name',
			'section',
			'order',
			'player_counts',
			'difficulty',
			{
				id: 'flags',
				header: m.db_raid_groups_col_flags,
				type: 'flags',
				flags,
				fields: ['hl', 'extra', 'guidebooks', 'unlimited', 'support_summon'],
				sortable: false,
				minWidth: '200px'
			},
			'raid_count',
			'hl',
			'extra',
			'guidebooks',
			'unlimited',
			'support_summon',
			'updated_at'
		],
		filters: [
			'section',
			{
				id: 'flags',
				label: m.db_raid_groups_col_flags,
				toggles: ['hl', 'extra', 'guidebooks', 'unlimited', 'support_summon']
			}
		],
		baseFields: ['name_en', 'name_jp'],
		// The raid list's order
		defaultSort: [
			{ id: 'section', desc: false },
			{ id: 'order', desc: false }
		]
	},

	// The detail Info tab's order; edit and create use it too
	layout: {
		detail: [
			{
				id: 'details',
				title: m.db_raid_groups_section_details,
				fields: ['name', 'section', 'order', 'difficulty']
			},
			{
				id: 'flags',
				title: m.db_raid_groups_section_flags,
				fields: ['hl', 'extra', 'guidebooks', 'unlimited', 'support_summon']
			},
			{
				id: 'raids',
				title: m.db_raid_groups_section_raids,
				fields: ['raids'],
				component: 'raidGroupRaids',
				// Its title counts the raids
				container: false
			}
		]
	},

	// Both names are required by the API
	refine: (v, issue) => {
		const name = v.name as { ja?: string } | undefined
		if (!name?.ja?.trim()) issue('name.ja', m.db_field_required())
	},

	record: {
		fetch: (id) => raidAdapter.getGroupById(id),
		query: (id) => raidQueries.group(id),
		routeId: (g) => g.id,
		noun: m.db_raid_groups_noun,
		type: 'raid',
		// A group has no art of its own: its first raid's
		image: (g) => getRaidImage(g.raids?.[0]?.slug, 'thumbnail')
	},

	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (g, payload) => raidAdapter.updateGroup(g.id, payload as UpdateRaidGroupInput),
		create: (payload) => raidAdapter.createGroup(payload as unknown as CreateRaidGroupInput)
	},

	section: raidGroupsSection
})
