/**
 * The artifact skills resource (GBF-143): the skills an artifact's four
 * slots draw from, keyed by group and modifier. Skills come from the game,
 * so they're edit-only: no new page, no "New" action. One list with a Group
 * column, sorted by group then modifier, replaces the old page's three
 * grouped tables.
 */
import { z } from 'zod'
import * as m from '$lib/paraglide/messages'
import { artifactAdapter, type ArtifactSkillPayload } from '$lib/api/adapters/artifact.adapter'
import { artifactKeys, artifactQueries } from '$lib/api/queries/artifact.queries'
import { artifactSkillsSection } from '$lib/features/database/artifact-skills/section'
import { defineResource, type EnumOption } from '$lib/features/database/schema/types'
import type { AdminArtifactSkillRow } from '$lib/types/api/admin'
import type { ArtifactSkill } from '$lib/types/api/artifact'
import { baseValuesSchema, formatBaseValues, trimBaseValues } from './baseValues'

const groupOptions = (): EnumOption[] => [
	{ value: 'group_i', label: m.db_artifact_skills_group_i },
	{ value: 'group_ii', label: m.db_artifact_skills_group_ii },
	{ value: 'group_iii', label: m.db_artifact_skills_group_iii }
]

const polarityOptions = (): EnumOption[] => [
	{ value: 'positive', label: m.db_artifact_skills_polarity_positive },
	{ value: 'negative', label: m.db_artifact_skills_polarity_negative }
]

const scoreCategoryOptions = (): EnumOption[] => [
	{ value: 1, label: m.db_artifact_skills_score_attack },
	{ value: 2, label: m.db_artifact_skills_score_defense },
	{ value: 3, label: m.db_artifact_skills_score_special }
]

export const artifactSkillsResource = defineResource<AdminArtifactSkillRow, ArtifactSkill>({
	name: 'artifact-skills',
	fields: [
		// Display names
		{
			key: 'name',
			kind: 'localized',
			label: m.db_artifact_skills_col_name,
			keys: { en: 'name_en', ja: 'name_jp' },
			labels: { en: m.db_artifact_skills_field_name_en, ja: m.db_artifact_skills_field_name_jp },
			required: true,
			// The API needs the Japanese name too
			validate: z.object({
				ja: z.string().refine((v) => v.trim() !== '', { error: () => m.db_field_required() })
			}),
			list: { primary: true, minWidth: '240px' }
		},
		// Game names, matched on import
		{
			key: 'game_name',
			kind: 'localized',
			label: m.db_artifact_skills_col_game_name,
			sublabel: m.db_artifact_skills_game_name_hint,
			keys: { en: 'game_name_en', ja: 'game_name_jp' },
			labels: {
				en: m.db_artifact_skills_field_game_name_en,
				ja: m.db_artifact_skills_field_game_name_jp
			},
			list: { minWidth: '200px' }
		},
		// Properties
		// Group and modifier are the skill's identity: saved artifacts store
		// their skills by that pair, so the editor shows them but never writes them
		{
			key: 'skill_group',
			kind: 'enum',
			label: m.db_artifact_skills_field_group,
			options: groupOptions,
			write: false,
			list: { width: '180px' },
			filter: { kind: 'multi', facet: true }
		},
		{
			key: 'modifier',
			kind: 'number',
			label: m.db_artifact_skills_field_modifier,
			int: true,
			write: false,
			list: { width: '96px' }
		},
		{
			key: 'polarity',
			kind: 'enum',
			label: m.db_artifact_skills_field_polarity,
			options: polarityOptions,
			required: true,
			list: { width: '110px' },
			filter: { kind: 'multi', facet: true }
		},
		{
			key: 'growth',
			kind: 'number',
			label: m.db_artifact_skills_field_growth,
			sublabel: m.db_artifact_skills_growth_hint,
			detail: { sublabel: false },
			list: { defaultHidden: true, width: '96px' }
		},
		{
			// Set by artifact imports; editors only read it
			key: 'score_category',
			kind: 'enum',
			label: m.db_artifact_skills_field_score_category,
			sublabel: m.db_artifact_skills_score_category_hint,
			options: scoreCategoryOptions,
			write: false,
			detail: { sublabel: false },
			list: { defaultHidden: true, width: '140px' },
			filter: { kind: 'multi', facet: true }
		},
		{
			key: 'base_values',
			kind: 'custom',
			label: m.db_artifact_skills_field_base_values,
			sublabel: m.db_artifact_skills_base_values_hint,
			default: [],
			// An empty list is a valid value (the column can't be null)
			empty: 'keep',
			write: { value: trimBaseValues },
			validate: baseValuesSchema,
			render: { input: 'artifactSkillBaseValues' },
			detail: { sublabel: false, value: (s) => formatBaseValues(s.baseValues) },
			list: {
				value: (s) => formatBaseValues(s.baseValues),
				sortable: false,
				minWidth: '200px'
			}
		},
		{
			key: 'suffix',
			kind: 'localized',
			label: m.db_artifact_skills_field_suffix,
			keys: { en: 'suffix_en', ja: 'suffix_jp' },
			labels: {
				en: m.db_artifact_skills_field_suffix_en,
				ja: m.db_artifact_skills_field_suffix_jp
			},
			// Most skills have none; blank is stored as "", as before
			empty: 'keep',
			list: { defaultHidden: true, sortable: false, width: '96px' }
		},
		{
			key: 'updated_at',
			kind: 'datetime',
			label: m.db_col_updated_at,
			write: false,
			detail: false,
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
		label: m.db_artifact_skills_label,
		entity: m.db_artifact_skills_entity,
		empty: m.db_artifact_skills_empty,
		title: 'name',
		rowId: (s) => s.id,
		columns: [
			'skill_group',
			'modifier',
			'name',
			'game_name',
			'polarity',
			'base_values',
			'growth',
			'suffix',
			'score_category',
			'updated_at'
		],
		filters: ['skill_group', 'polarity', 'score_category', 'updated_at'],
		baseFields: ['name_en', 'name_jp'],
		defaultSort: [
			{ id: 'skill_group', desc: false },
			{ id: 'modifier', desc: false }
		]
	},

	// The old edit page's sections, in its order; the edit form uses them too
	layout: {
		detail: [
			{ id: 'names', title: m.db_artifact_skills_section_names, fields: ['name'] },
			{
				id: 'game_names',
				title: m.db_artifact_skills_section_game_names,
				fields: ['game_name']
			},
			{
				id: 'properties',
				title: m.db_artifact_skills_section_properties,
				fields: ['skill_group', 'modifier', 'polarity', 'growth', 'score_category']
			},
			{
				id: 'base_values',
				title: m.db_artifact_skills_section_base_values,
				fields: ['base_values']
			},
			{ id: 'suffix', title: m.db_artifact_skills_section_suffix, fields: ['suffix'] }
		]
	},

	record: {
		fetch: (id) => artifactAdapter.getSkill(id),
		query: (id) => artifactQueries.skillById(id),
		routeId: (s) => s.id,
		noun: m.db_artifact_skills_noun
	},

	// No `create`: the new page 404s and the section has no "New" action
	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (s, payload) => artifactAdapter.updateSkill(s.id, payload as ArtifactSkillPayload),
		// The party builder's skill pickers cache the skill lists for an hour
		invalidates: () => [artifactKeys.skills]
	},

	section: artifactSkillsSection
})
