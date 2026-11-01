/**
 * The jobs resource: every field the jobs list, detail, edit and new pages
 * show, described once (GBF-143). A Class I job and its Class II successor
 * share a Granblue ID (Fighter and Warrior are both 100001), so jobs are
 * listed, linked and saved by their id.
 */
import { z } from 'zod'
import * as m from '$lib/paraglide/messages'
import { jobAdapter, type JobUpdatePayload } from '$lib/api/adapters/job.adapter'
import { jobQueries } from '$lib/api/queries/job.queries'
import { weaponProficiencyFilterOptions } from '$lib/components/data-table/filterOptions'
import { jobsSection } from '$lib/features/database/jobs/section'
import JobImagesTab from '$lib/features/database/jobs/tabs/JobImagesTab.svelte'
import JobSkillsTab from '$lib/features/database/jobs/tabs/JobSkillsTab.svelte'
import { defineResource, type EnumOption, type Values } from '$lib/features/database/schema/types'
import { getAccessoryTypeName } from '$lib/utils/jobAccessoryUtils'
import { getJobIconUrl, getJobTierName } from '$lib/utils/jobUtils'
import { getWeaponProficiencyOptions } from '$lib/utils/proficiency'
import type { AdminJobRow } from '$lib/types/api/admin'
import type { Job } from '$lib/types/api/entities'

// Six digits; matches the API's Job::GRANBLUE_ID_FORMAT
const GRANBLUE_ID = /^\d{6}$/

/** Rows as the API stores them (Job::ROWS), in tier order */
export const JOB_ROWS = ['1', '2', '3', '4', '5', 'ex1', 'ex2', 'o1'] as const

const rowOptions = (): EnumOption[] =>
	JOB_ROWS.map((row) => ({ value: row, label: () => getJobTierName(row) }))

/** None (0), Shield (1) and Manatura (2): Job::ACCESSORY_TYPES */
const accessoryTypeOptions = (): EnumOption[] => [
	{ value: 0, label: m.option_none },
	...[1, 2].map((type) => ({ value: type, label: () => getAccessoryTypeName(type) }))
]

const hasAccessory = (v: Values) => v.accessory === true

export const jobsResource = defineResource<AdminJobRow, Job>({
	name: 'jobs',
	fields: [
		// Metadata
		{
			key: 'name',
			kind: 'localized',
			label: m.db_jobs_col_name,
			keys: { en: 'name_en', ja: 'name_jp' },
			labels: { en: m.db_jobs_field_name_en, ja: m.db_jobs_field_name_jp },
			required: true,
			list: { primary: true, minWidth: '200px' }
		},
		{
			key: 'granblue_id',
			kind: 'code',
			label: m.db_jobs_field_granblue_id,
			required: true,
			validate: z
				.string()
				.regex(GRANBLUE_ID, { error: () => m.db_jobs_field_granblue_id_invalid() }),
			list: { defaultHidden: true }
		},
		{
			key: 'row',
			kind: 'enum',
			label: m.db_jobs_field_row,
			options: rowOptions,
			default: '1',
			required: true,
			list: { width: '110px' },
			filter: { kind: 'multi', facet: true }
		},
		{
			key: 'order',
			kind: 'number',
			label: m.db_jobs_field_order,
			sublabel: m.db_jobs_hint_order,
			int: true,
			min: 0,
			detail: { sublabel: false },
			list: { width: '90px' }
		},
		// Both proficiencies, for the list's column and filter (the API matches either)
		{
			key: 'proficiency',
			kind: 'enumList',
			label: m.db_jobs_col_proficiency,
			options: getWeaponProficiencyOptions,
			write: false,
			form: false,
			detail: false,
			list: {
				type: 'proficiency',
				value: (j) => [j.proficiency1, j.proficiency2],
				sortable: false,
				width: '168px',
				fields: ['proficiency1', 'proficiency2']
			},
			filter: { kind: 'multi', options: weaponProficiencyFilterOptions, facet: true }
		},
		// Proficiencies
		{
			key: 'proficiency1',
			kind: 'enum',
			label: m.db_jobs_field_proficiency1,
			options: getWeaponProficiencyOptions,
			read: (j) => j.proficiency?.[0] || null,
			required: true,
			// Draws as the proficiency's label
			list: { type: 'proficiency' }
		},
		{
			key: 'proficiency2',
			kind: 'enum',
			label: m.db_jobs_field_proficiency2,
			options: getWeaponProficiencyOptions,
			read: (j) => j.proficiency?.[1] || null,
			required: true,
			list: { type: 'proficiency' }
		},
		// Features
		{
			key: 'master_level',
			kind: 'boolean',
			label: m.db_jobs_field_master_level,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'ultimate_mastery',
			kind: 'boolean',
			label: m.db_jobs_field_ultimate_mastery,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'aux_weapon',
			kind: 'boolean',
			label: m.db_jobs_field_aux_weapon,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'accessory',
			kind: 'boolean',
			label: m.db_jobs_field_accessory,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'accessory_type',
			kind: 'enum',
			label: m.db_jobs_field_accessory_type,
			options: accessoryTypeOptions,
			default: 0,
			required: true,
			when: hasAccessory,
			// Unticking Has Accessory sets it back to None
			whenHidden: 'empty',
			write: { value: (v) => v ?? 0 },
			list: { sortable: false, defaultHidden: true },
			filter: { kind: 'multi', facet: true }
		},
		// List only
		{
			key: 'skill_count',
			kind: 'number',
			label: m.db_jobs_col_skill_count,
			write: false,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'updated_at',
			kind: 'datetime',
			label: m.db_jobs_col_updated_at,
			write: false,
			list: { defaultHidden: true },
			filter: {
				kind: 'recent',
				label: m.db_jobs_filter_updated,
				presets: [
					{ days: 7, label: m.db_jobs_filter_updated_7 },
					{ days: 30, label: m.db_jobs_filter_updated_30 }
				]
			}
		}
	],

	list: {
		label: m.db_jobs_label,
		pageTitle: m.page_title_db_jobs,
		entity: m.db_jobs_entity,
		empty: m.db_jobs_empty,
		title: 'name',
		rowId: (j) => j.id,
		pinFirstColumn: true,
		movedViews: { skills: '/database/job-skills', accessories: '/database/job-accessories' },
		columns: [
			{
				id: 'icon',
				header: '',
				type: 'image',
				image: (j) => ({ src: getJobIconUrl(j.granblueId) }),
				sortable: false,
				hideable: false,
				width: '56px',
				minWidth: '56px'
			},
			'name',
			'row',
			'proficiency',
			{
				id: 'features',
				header: m.db_jobs_col_features,
				type: 'flags',
				flags: (j) => [
					...(j.masterLevel
						? [{ label: m.db_jobs_feature_master(), tone: 'awaken' as const }]
						: []),
					...(j.ultimateMastery
						? [{ label: m.db_jobs_feature_ultimate(), tone: 'ax' as const }]
						: []),
					...(j.accessory ? [{ label: m.db_jobs_feature_accessory(), tone: 'keys' as const }] : [])
				],
				sortable: false,
				width: '220px',
				fields: ['master_level', 'ultimate_mastery', 'accessory']
			},
			'order',
			'granblue_id',
			'master_level',
			'ultimate_mastery',
			'aux_weapon',
			'accessory',
			'accessory_type',
			'skill_count',
			'updated_at'
		],
		filters: [
			'row',
			'proficiency',
			'accessory_type',
			{
				id: 'features',
				label: m.db_jobs_filter_features,
				toggles: ['master_level', 'ultimate_mastery', 'aux_weapon', 'accessory']
			},
			{
				id: 'quality',
				label: m.db_jobs_filter_quality,
				toggles: [{ key: 'no_skills', label: m.db_jobs_filter_no_skills }]
			},
			'updated_at'
		],
		// The icon needs the Granblue ID whichever columns are visible
		baseFields: ['granblue_id', 'name_en', 'name_jp'],
		defaultSort: [
			{ id: 'row', desc: false },
			{ id: 'order', desc: false }
		]
	},

	layout: {
		detail: [
			{
				id: 'metadata',
				title: m.db_jobs_section_metadata,
				fields: ['name', 'granblue_id', 'row', 'order']
			},
			{
				id: 'proficiencies',
				title: m.db_jobs_section_proficiencies,
				fields: ['proficiency1', 'proficiency2']
			},
			{
				id: 'features',
				title: m.db_jobs_section_features,
				fields: ['master_level', 'ultimate_mastery', 'aux_weapon', 'accessory', 'accessory_type']
			}
		]
	},

	record: {
		fetch: (id) => jobAdapter.getById(id),
		query: (id) => jobQueries.byId(id),
		routeId: (j) => j.id,
		noun: m.db_jobs_noun,
		type: 'job',
		image: (j) => getJobIconUrl(j.granblueId),
		tabs: [
			{ id: 'skills', label: m.db_jobs_tab_skills, component: JobSkillsTab },
			{ id: 'images', label: m.db_detail_tab_images, component: JobImagesTab }
		]
	},

	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (j, payload) => jobAdapter.updateJob(j.id, payload as JobUpdatePayload),
		create: (payload) => jobAdapter.createJob(payload as JobUpdatePayload)
	},

	section: jobsSection
})
