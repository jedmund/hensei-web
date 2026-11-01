/**
 * The job skills resource: every field the job skills list, detail, edit and
 * new pages show, described once (GBF-143). Skills have no Granblue ID, so
 * they're listed, linked and saved by their id; a job's "Add skill" link
 * presets the job (`?job=<id>`).
 */
import { z } from 'zod'
import * as m from '$lib/paraglide/messages'
import { jobAdapter, type JobSkillPayload } from '$lib/api/adapters/job.adapter'
import { jobQueries } from '$lib/api/queries/job.queries'
import { jobFilterOptions } from '$lib/components/data-table/filterOptions'
import { jobSkillsSection } from '$lib/features/database/job-skills/section'
import { defineResource, type EnumOption, type Values } from '$lib/features/database/schema/types'
import { getJobSkillIcon } from '$lib/utils/images/icons'
import { getSkillColorName } from '$lib/utils/jobUtils'
import { localizedName } from '$lib/utils/locale'
import type { AdminJobSkillRow } from '$lib/types/api/admin'
import type { Job, JobSkill } from '$lib/types/api/entities'

// Kebab-case, as the image is <slug>.png; matches the API's JobSkill::SLUG_FORMAT
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Yellow (0) to Purple (4): JobSkill::COLORS */
const colorOptions = (): EnumOption[] =>
	[0, 1, 2, 3, 4].map((color) => ({ value: color, label: getSkillColorName(color) }))

/** "Rage IV" → "rage-iv", "Parfait d'Amour" → "parfait-damour" */
export function slugify(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/[\s-]+/g, '-')
}

/**
 * On the new page the slug follows the English name until it's edited by
 * hand (or the box is unticked)
 */
function slugFollowsName(v: Values, changed: string | null): Values | undefined {
	if (changed === 'slug') return v.slug_auto ? { slug_auto: false } : undefined
	if (v.slug_auto !== true || (changed !== 'name' && changed !== 'slug_auto')) return undefined
	return { slug: slugify((v.name as { en?: string } | null)?.en ?? '') }
}

/** A skill's kinds: it can be more than one (60 main skills are also subskills) */
const KINDS = ['main', 'sub', 'emp', 'base'] as const

const KIND_LABELS: Record<(typeof KINDS)[number], () => string> = {
	main: m.db_job_skills_field_main,
	sub: m.db_job_skills_field_sub,
	emp: m.db_job_skills_field_emp,
	base: m.db_job_skills_field_base
}

export const jobSkillsResource = defineResource<AdminJobSkillRow, JobSkill>({
	name: 'job-skills',
	fields: [
		// Metadata
		{
			key: 'name',
			kind: 'localized',
			label: m.db_job_skills_col_name,
			keys: { en: 'name_en', ja: 'name_jp' },
			labels: { en: m.db_job_skills_field_name_en, ja: m.db_job_skills_field_name_jp },
			required: true,
			list: { primary: true, minWidth: '200px' }
		},
		{
			key: 'slug',
			kind: 'text',
			label: m.db_job_skills_field_slug,
			sublabel: m.db_job_skills_hint_slug,
			required: true,
			validate: z.string().regex(SLUG, { error: () => m.db_job_skills_field_slug_invalid() }),
			detail: { sublabel: false },
			list: { defaultHidden: true }
		},
		{
			key: 'slug_auto',
			kind: 'boolean',
			label: m.db_job_skills_field_slug_auto,
			default: true,
			write: false,
			form: { edit: false },
			detail: false
		},
		{
			key: 'image_id',
			kind: 'text',
			label: m.db_job_skills_field_image_id,
			form: { placeholder: m.db_job_skills_hint_image_id },
			list: { defaultHidden: true, sortable: false }
		},
		{
			key: 'action_id',
			kind: 'number',
			label: m.db_job_skills_field_action_id,
			int: true,
			min: 1,
			list: { defaultHidden: true, sortable: false }
		},
		// Classification
		{
			key: 'main',
			kind: 'boolean',
			label: m.db_job_skills_field_main,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'sub',
			kind: 'boolean',
			label: m.db_job_skills_field_sub,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'emp',
			kind: 'boolean',
			label: m.db_job_skills_field_emp,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'base',
			kind: 'boolean',
			label: m.db_job_skills_field_base,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'color',
			kind: 'enum',
			label: m.db_job_skills_field_color,
			options: colorOptions,
			default: 0,
			required: true,
			list: { width: '90px' },
			filter: { kind: 'multi', facet: true }
		},
		{
			key: 'order',
			kind: 'number',
			label: m.db_job_skills_field_order,
			sublabel: m.db_job_skills_hint_order,
			int: true,
			min: 0,
			detail: { sublabel: false },
			list: { width: '90px' }
		},
		// Associated job
		{
			key: 'job',
			kind: 'reference',
			label: m.db_job_skills_field_job,
			resource: 'job',
			write: 'job_id',
			required: true,
			list: {
				value: (s) =>
					s.job ? localizedName({ en: s.job.nameEn ?? '', ja: s.job.nameJp ?? '' }) : null,
				// The API sorts on the skill's own columns only
				sortable: false,
				width: '180px'
			},
			filter: {
				kind: 'multi',
				query: () => jobQueries.list(),
				options: (jobs) => jobFilterOptions(jobs as Job[] | undefined),
				facet: true
			}
		},
		// List only
		{
			key: 'updated_at',
			kind: 'datetime',
			label: m.db_job_skills_col_updated_at,
			write: false,
			list: { defaultHidden: true },
			filter: {
				kind: 'recent',
				label: m.db_job_skills_filter_updated,
				presets: [
					{ days: 7, label: m.db_job_skills_filter_updated_7 },
					{ days: 30, label: m.db_job_skills_filter_updated_30 }
				]
			}
		}
	],

	list: {
		label: m.db_job_skills_label,
		entity: m.db_job_skills_entity,
		empty: m.db_job_skills_empty,
		title: 'name',
		rowId: (s) => s.id,
		pinFirstColumn: true,
		columns: [
			{
				id: 'icon',
				header: '',
				type: 'image',
				image: (s) => ({ src: getJobSkillIcon({ slug: s.slug, imageId: s.imageId ?? undefined }) }),
				sortable: false,
				hideable: false,
				width: '56px',
				minWidth: '56px'
			},
			'name',
			{
				id: 'kind',
				header: m.db_job_skills_col_kind,
				type: 'flags',
				flags: (s) =>
					KINDS.filter((kind) => s[kind]).map((kind) => ({ label: KIND_LABELS[kind]() })),
				sortable: false,
				width: '180px',
				fields: [...KINDS]
			},
			'job',
			'color',
			'order',
			'slug',
			'image_id',
			'action_id',
			...KINDS,
			'updated_at'
		],
		filters: [
			'job',
			'color',
			{ id: 'kind', label: m.db_job_skills_filter_kind, toggles: [...KINDS] },
			'updated_at'
		],
		// The icon needs the slug and image id whichever columns are visible
		baseFields: ['name_en', 'name_jp', 'slug', 'image_id'],
		defaultSort: [{ id: 'name', desc: false }]
	},

	layout: {
		detail: [
			{
				id: 'metadata',
				title: m.db_job_skills_section_metadata,
				fields: ['name', 'slug', 'slug_auto', 'image_id', 'action_id']
			},
			{
				id: 'classification',
				title: m.db_job_skills_section_classification,
				fields: [...KINDS, 'color', 'order']
			},
			{ id: 'job', title: m.db_job_skills_section_job, fields: ['job'] }
		]
	},

	derive: [slugFollowsName],

	record: {
		fetch: (id) => jobAdapter.getSkillById(id),
		query: (id) => jobQueries.skillById(id),
		routeId: (s) => s.id,
		noun: m.db_job_skills_noun,
		type: 'jobSkill',
		image: (s) => getJobSkillIcon(s)
	},

	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (s, payload) => jobAdapter.updateSkill(s.id, payload as Partial<JobSkillPayload>),
		create: (payload) => jobAdapter.createSkill(payload as unknown as JobSkillPayload)
	},

	section: jobSkillsSection
})
