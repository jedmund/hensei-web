/**
 * The raids resource: every field the raids list, detail, edit and new pages
 * show, described once (GBF-143). A raid's route id is its slug. Its group's
 * difficulty and flags show in the detail, read-only; groups are their own
 * resource (`raid-groups`).
 */
import { z } from 'zod'
import * as m from '$lib/paraglide/messages'
import { raidAdapter } from '$lib/api/adapters/raid.adapter'
import { raidQueries } from '$lib/api/queries/raid.queries'
import { elementFilterOptions } from '$lib/components/data-table/filterOptions'
import { raidsSection } from '$lib/features/database/raids/section'
import RaidImagesTab from '$lib/features/database/raids/tabs/RaidImagesTab.svelte'
import { defineResource, type EnumOption } from '$lib/features/database/schema/types'
import { getElementOptions } from '$lib/utils/element'
import { getRaidCdnImage, getRaidImage } from '$lib/utils/images/raids'
import { localizedName } from '$lib/utils/locale'
import { compareRaidGroups } from '$lib/utils/raidSection'
import type { AdminRaidRow } from '$lib/types/api/admin'
import type { CreateRaidInput, RaidFull, RaidGroupFull, UpdateRaidInput } from '$lib/types/api/raid'

// Lowercase words joined by dashes; matches the API's Raid::SLUG_FORMAT
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Raids are solo, or for 6, 18 or 30 players */
export const playerCountOptions = (): EnumOption[] => [
	{ value: 1, label: m.db_raids_players_solo },
	...[6, 18, 30].map((count) => ({
		value: count,
		label: () => m.db_raids_players_count({ count: String(count) })
	}))
]

const groupName = (group: { nameEn?: string | null; nameJp?: string | null } | null | undefined) =>
	group ? localizedName({ en: group.nameEn ?? '', ja: group.nameJp ?? '' }) : null

/** Game ids are positive whole numbers */
const gameId = { kind: 'number', int: true, min: 1 } as const

export const raidsResource = defineResource<AdminRaidRow, RaidFull>({
	name: 'raids',
	fields: [
		// Raid details
		{
			key: 'name',
			kind: 'localized',
			label: m.db_raids_col_name,
			keys: { en: 'name_en', ja: 'name_jp' },
			labels: { en: m.db_raids_field_name_en, ja: m.db_raids_field_name_ja },
			required: true,
			list: { primary: true, minWidth: '220px' }
		},
		{
			key: 'slug',
			kind: 'code',
			label: m.db_raids_field_slug,
			required: true,
			validate: z.string().regex(SLUG, { error: () => m.db_raids_field_slug_invalid() }),
			form: { placeholder: m.db_raids_hint_slug },
			list: { defaultHidden: true }
		},
		{
			key: 'level',
			kind: 'number',
			label: m.db_raids_field_level,
			int: true,
			min: 0,
			list: { width: '80px' }
		},
		{
			key: 'player_count',
			kind: 'enum',
			label: m.db_raids_field_players,
			options: playerCountOptions,
			default: 18,
			required: true,
			list: { width: '112px', defaultHidden: true },
			filter: { kind: 'multi', facet: true }
		},
		{
			key: 'element',
			kind: 'enum',
			label: m.db_raids_field_element,
			options: getElementOptions,
			default: 0,
			required: true,
			list: { type: 'element' },
			filter: {
				kind: 'multi',
				options: () => elementFilterOptions({ includeNull: true }),
				facet: true
			}
		},
		// IDs the game's art is fetched by
		{ ...gameId, key: 'enemy_id', label: m.db_raids_field_enemy_id },
		{ ...gameId, key: 'summon_id', label: m.db_raids_field_summon_id },
		{ ...gameId, key: 'quest_id', label: m.db_raids_field_quest_id },
		{
			key: 'released_at',
			kind: 'date',
			label: m.db_raids_field_released_at,
			sublabel: m.db_raids_hint_released_at,
			detail: { sublabel: false },
			list: { defaultHidden: true }
		},
		// Classification: the group, and what the raid takes from it
		{
			key: 'group',
			kind: 'reference',
			label: m.db_raids_field_group,
			resource: 'raidGroup',
			write: 'group_id',
			required: true,
			list: {
				value: (r) => groupName(r.group),
				// Groups sort by their place in the raid list
				sortField: 'group_order',
				width: '200px'
			},
			filter: {
				kind: 'multi',
				// Fresh on every visit, so a group created a moment ago is there
				query: () => ({ ...raidQueries.groups(), staleTime: 0 }),
				options: (groups) =>
					((groups as RaidGroupFull[] | undefined) ?? [])
						.toSorted(compareRaidGroups)
						.map((g) => ({ value: g.id, label: localizedName(g.name) })),
				facet: true
			}
		},
		{
			key: 'difficulty',
			kind: 'number',
			label: m.db_raids_field_difficulty,
			read: (r) => r.group?.difficulty,
			write: false
		},
		{
			key: 'hl',
			kind: 'boolean',
			label: m.db_raids_field_hl,
			read: (r) => r.group?.hl,
			write: false
		},
		{
			key: 'extra',
			kind: 'boolean',
			label: m.db_raids_field_extra,
			sublabel: m.db_raids_hint_extra,
			detail: { sublabel: false },
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'guidebooks',
			kind: 'boolean',
			label: m.db_raids_field_guidebooks,
			read: (r) => r.group?.guidebooks,
			write: false
		},
		// List only
		{
			key: 'updated_at',
			kind: 'datetime',
			label: m.db_col_updated_at,
			write: false,
			list: { defaultHidden: true },
			filter: {
				kind: 'recent',
				presets: [
					{ days: 7, label: m.db_filter_updated_7 },
					{ days: 30, label: m.db_filter_updated_30 }
				]
			}
		}
	],

	list: {
		label: m.db_raids_label,
		entity: m.db_raids_entity,
		empty: m.db_raids_empty,
		title: 'name',
		element: 'element',
		rowId: (r) => r.slug,
		rowHeight: 'image',
		columns: [
			{
				id: 'image',
				header: '',
				type: 'image',
				image: (r) => ({ src: getRaidImage(r.slug, 'thumbnail') }),
				sortable: false,
				hideable: false,
				width: '96px',
				minWidth: '96px'
			},
			'name',
			'level',
			'element',
			'group',
			'player_count',
			'slug',
			'released_at',
			'extra',
			'updated_at'
		],
		filters: [
			'element',
			'group',
			'player_count',
			{ id: 'flags', label: m.db_raids_filter_flags, toggles: ['hl', 'extra'] },
			'updated_at'
		],
		// A row's id and link are its slug
		baseFields: ['slug', 'name_en', 'name_jp'],
		// The API's own order: by group (section, then order), element, then level
		defaultSort: [],
		// Raid groups were this list's Groups tab
		movedViews: { groups: '/database/raid-groups' }
	},

	// The detail Info tab's order; edit and create use it too
	layout: {
		detail: [
			{
				id: 'details',
				title: m.db_raids_section_details,
				fields: ['name', 'slug', 'level', 'player_count', 'element']
			},
			{
				id: 'ids',
				title: m.db_raids_section_ids,
				fields: ['enemy_id', 'summon_id', 'quest_id', 'released_at']
			},
			{
				id: 'classification',
				title: m.db_raids_section_classification,
				fields: ['group', 'difficulty', 'hl', 'extra', 'guidebooks']
			}
		]
	},

	record: {
		fetch: (slug) => raidAdapter.getBySlug(slug),
		query: (slug) => raidQueries.bySlug(slug),
		routeId: (r) => r.slug,
		noun: m.db_raids_noun,
		type: 'raid',
		image: (r) => getRaidImage(r.slug, 'thumbnail'),
		fallbackImage: (r) => (r.enemyId ? getRaidCdnImage('icon', r.enemyId) : undefined),
		element: (r) => r.element,
		tabs: [{ id: 'images', label: m.db_detail_tab_images, component: RaidImagesTab }]
	},

	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (r, payload) => raidAdapter.update(r.slug, payload as UpdateRaidInput),
		create: (payload) => raidAdapter.create(payload as unknown as CreateRaidInput)
	},

	section: raidsSection
})
