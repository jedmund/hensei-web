/**
 * The job accessories resource (shields and manaturas): every field the
 * accessories list, detail, edit and new pages show, described once
 * (GBF-143). The job is picked on the form: two jobs take each type.
 */
import { z } from 'zod'
import * as m from '$lib/paraglide/messages'
import { jobAdapter, type JobAccessoryPayload } from '$lib/api/adapters/job.adapter'
import { jobQueries } from '$lib/api/queries/job.queries'
import { jobFilterOptions, rarityFilterOptions } from '$lib/components/data-table/filterOptions'
import { jobAccessoriesSection } from '$lib/features/database/job-accessories/section'
import AccessoryImagesTab from '$lib/features/database/job-accessories/tabs/AccessoryImagesTab.svelte'
import { defineResource } from '$lib/features/database/schema/types'
import { getAccessoryImage } from '$lib/utils/images/equipment'
import { getAccessoryTypeOptions } from '$lib/utils/jobAccessoryUtils'
import { localizedName } from '$lib/utils/locale'
import { getRarityOptions } from '$lib/utils/rarity'
import type { AdminJobAccessoryRow } from '$lib/types/api/admin'
import type { Job, JobAccessory } from '$lib/types/api/entities'

// Digits; matches the API's JobAccessory granblue_id format
const GRANBLUE_ID = /^\d+$/

export const jobAccessoriesResource = defineResource<AdminJobAccessoryRow, JobAccessory>({
	name: 'job-accessories',
	fields: [
		// Metadata
		{
			key: 'name',
			kind: 'localized',
			label: m.db_job_accessories_col_name,
			keys: { en: 'name_en', ja: 'name_jp' },
			labels: { en: m.db_job_accessories_field_name_en, ja: m.db_job_accessories_field_name_jp },
			required: true,
			list: { primary: true, minWidth: '200px' }
		},
		{
			key: 'rarity',
			kind: 'enum',
			label: m.db_job_accessories_field_rarity,
			options: getRarityOptions,
			default: 3,
			list: { width: '80px' },
			filter: { kind: 'multi', options: rarityFilterOptions, facet: true }
		},
		{
			key: 'granblue_id',
			kind: 'code',
			label: m.db_job_accessories_field_granblue_id,
			required: true,
			validate: z
				.string()
				.regex(GRANBLUE_ID, { error: () => m.db_job_accessories_field_granblue_id_invalid() }),
			list: { width: '110px' }
		},
		// Classification
		{
			key: 'accessory_type',
			kind: 'enum',
			label: m.db_job_accessories_field_accessory_type,
			options: getAccessoryTypeOptions,
			default: 1,
			required: true,
			list: { width: '110px' },
			filter: { kind: 'multi', facet: true }
		},
		{
			key: 'release_date',
			kind: 'date',
			label: m.db_job_accessories_field_release_date,
			list: { width: '120px' }
		},
		// Associated job
		{
			key: 'job',
			kind: 'reference',
			label: m.db_job_accessories_field_job,
			resource: 'job',
			write: 'job_id',
			required: true,
			list: {
				value: (a) =>
					a.job ? localizedName({ en: a.job.nameEn ?? '', ja: a.job.nameJp ?? '' }) : null,
				// The API sorts on the accessory's own columns only
				sortable: false,
				width: '160px'
			},
			filter: {
				kind: 'multi',
				query: () => jobQueries.list(),
				options: (jobs) =>
					jobFilterOptions((jobs as Job[] | undefined)?.filter((job) => job.accessory)),
				facet: true
			}
		},
		// List only
		{
			key: 'updated_at',
			kind: 'datetime',
			label: m.db_job_accessories_col_updated_at,
			write: false,
			list: { defaultHidden: true },
			filter: {
				kind: 'recent',
				label: m.db_job_accessories_filter_updated,
				presets: [
					{ days: 7, label: m.db_job_accessories_filter_updated_7 },
					{ days: 30, label: m.db_job_accessories_filter_updated_30 }
				]
			}
		}
	],

	list: {
		label: m.db_job_accessories_label,
		entity: m.db_job_accessories_entity,
		empty: m.db_job_accessories_empty,
		title: 'name',
		rowHeight: 'image',
		pinFirstColumn: true,
		columns: [
			{
				id: 'image',
				header: '',
				type: 'image',
				image: (a) => ({ src: getAccessoryImage(a.granblueId) }),
				sortable: false,
				hideable: false,
				width: '96px',
				minWidth: '96px'
			},
			'name',
			'accessory_type',
			'job',
			'rarity',
			'granblue_id',
			'release_date',
			'updated_at'
		],
		filters: ['accessory_type', 'rarity', 'job', 'updated_at'],
		baseFields: ['granblue_id', 'name_en', 'name_jp'],
		defaultSort: [
			{ id: 'accessory_type', desc: false },
			{ id: 'granblue_id', desc: false }
		]
	},

	layout: {
		detail: [
			{
				id: 'metadata',
				title: m.db_job_accessories_section_metadata,
				fields: ['name', 'rarity', 'granblue_id']
			},
			{
				id: 'classification',
				title: m.db_job_accessories_section_classification,
				fields: ['accessory_type', 'release_date']
			},
			{ id: 'job', title: m.db_job_accessories_section_job, fields: ['job'] }
		]
	},

	record: {
		fetch: (id) => jobAdapter.getAccessoryById(id),
		query: (id) => jobQueries.accessoryById(id),
		routeId: (a) => a.granblueId,
		noun: m.db_job_accessories_noun,
		type: 'accessory',
		image: (a) => getAccessoryImage(a.granblueId),
		tabs: [{ id: 'images', label: m.db_detail_tab_images, component: AccessoryImagesTab }]
	},

	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (a, payload) =>
			jobAdapter.updateAccessory(a.granblueId, payload as Partial<JobAccessoryPayload>),
		create: (payload) => jobAdapter.createAccessory(payload as unknown as JobAccessoryPayload)
	},

	section: jobAccessoriesSection
})
