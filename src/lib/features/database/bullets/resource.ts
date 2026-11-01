/**
 * The bullets resource: every field the bullets list, detail, edit and new
 * pages show, described once (GBF-143). Every bullet has a Granblue ID, and
 * bullets are listed, linked and saved by it, so old
 * `/database/bullets/<granblue id>` links keep working.
 */
import { z } from 'zod'
import * as m from '$lib/paraglide/messages'
import { bulletAdapter, type BulletPayload } from '$lib/api/adapters/bullet.adapter'
import { bulletKeys, bulletQueries } from '$lib/api/queries/bullet.queries'
import { bulletsSection } from '$lib/features/database/bullets/section'
import { SLUG } from '$lib/features/database/schema/sluggedFields'
import { defineResource, type EnumOption } from '$lib/features/database/schema/types'
import { getBulletImage } from '$lib/utils/images/equipment'
import { BULLET_TYPES } from '$lib/types/api/entities'
import type { AdminBulletRow } from '$lib/types/api/admin'
import type { Bullet } from '$lib/types/api/entities'

// Five digits; matches the API's Bullet::GRANBLUE_ID_FORMAT
const GRANBLUE_ID = /^\d{5}$/

/** Parabellum, Rifle, Cartridge and Aetherial: GranblueEnums::BULLET_TYPES */
const bulletTypeOptions = (): EnumOption[] =>
	Object.entries(BULLET_TYPES).map(([value, label]) => ({
		value: Number(value),
		label: () => label
	}))

export const bulletsResource = defineResource<AdminBulletRow, Bullet>({
	name: 'bullets',
	fields: [
		// Metadata
		{
			key: 'name',
			kind: 'localized',
			label: m.db_bullets_col_name,
			keys: { en: 'name_en', ja: 'name_jp' },
			labels: { en: m.db_bullets_field_name_en, ja: m.db_bullets_field_name_jp },
			required: true,
			list: { primary: true, minWidth: '200px' }
		},
		{
			key: 'granblue_id',
			kind: 'code',
			label: m.db_bullets_field_granblue_id,
			required: true,
			validate: z
				.string()
				.regex(GRANBLUE_ID, { error: () => m.db_bullets_field_granblue_id_invalid() }),
			list: { width: '110px', defaultHidden: true }
		},
		{
			key: 'slug',
			kind: 'code',
			label: m.db_field_slug,
			required: true,
			validate: z.string().regex(SLUG, { error: () => m.db_field_slug_invalid() }),
			form: { placeholder: m.db_field_slug_placeholder, width: '240px' },
			list: { minWidth: '150px', defaultHidden: true }
		},
		// Properties
		{
			key: 'bullet_type',
			kind: 'enum',
			label: m.db_bullets_field_bullet_type,
			options: bulletTypeOptions,
			default: 1,
			required: true,
			list: { header: m.db_bullets_col_bullet_type, width: '120px' },
			filter: { kind: 'multi', facet: true }
		},
		{
			key: 'atk',
			kind: 'number',
			label: m.db_bullets_field_atk,
			int: true,
			min: 0,
			default: 0,
			required: true,
			list: { width: '80px' }
		},
		{
			key: 'hits_all',
			kind: 'boolean',
			label: m.db_bullets_field_hits_all,
			list: { width: '90px', sortable: false }
		},
		{
			key: 'order',
			kind: 'number',
			label: m.db_bullets_field_order,
			int: true,
			min: 0,
			default: 0,
			required: true,
			list: { width: '80px', defaultHidden: true }
		},
		// Effect
		{
			key: 'effect',
			kind: 'localized',
			label: m.db_bullets_col_effect,
			keys: { en: 'effect_en', ja: 'effect_jp' },
			labels: { en: m.db_bullets_field_effect_en, ja: m.db_bullets_field_effect_jp },
			list: { minWidth: '240px', sortable: false }
		},
		// List only
		{
			key: 'updated_at',
			kind: 'datetime',
			label: m.db_bullets_col_updated_at,
			write: false,
			list: { defaultHidden: true },
			filter: {
				kind: 'recent',
				label: m.db_bullets_filter_updated,
				presets: [
					{ days: 7, label: m.db_bullets_filter_updated_7 },
					{ days: 30, label: m.db_bullets_filter_updated_30 }
				]
			}
		}
	],

	list: {
		label: m.db_bullets_label,
		entity: m.db_bullets_entity,
		empty: m.db_bullets_empty,
		title: 'name',
		pinFirstColumn: true,
		columns: [
			{
				id: 'image',
				header: '',
				type: 'image',
				image: (b) => ({ src: getBulletImage(b.granblueId) }),
				sortable: false,
				hideable: false,
				width: '56px',
				minWidth: '56px'
			},
			'name',
			'bullet_type',
			'atk',
			'hits_all',
			'effect',
			'order',
			'granblue_id',
			'slug',
			'updated_at'
		],
		filters: [
			'bullet_type',
			{ id: 'properties', label: m.db_bullets_filter_properties, toggles: ['hits_all'] },
			'updated_at'
		],
		// The image needs the Granblue ID whichever columns are visible
		baseFields: ['granblue_id', 'name_en', 'name_jp'],
		defaultSort: [
			{ id: 'bullet_type', desc: false },
			{ id: 'order', desc: false }
		]
	},

	layout: {
		detail: [
			{
				id: 'metadata',
				title: m.db_bullets_section_metadata,
				fields: ['name', 'granblue_id', 'slug']
			},
			{
				id: 'properties',
				title: m.db_bullets_section_properties,
				fields: ['bullet_type', 'atk', 'hits_all', 'order']
			},
			{ id: 'effect', title: m.db_bullets_section_effect, fields: ['effect'] }
		]
	},

	record: {
		fetch: (id) => bulletAdapter.getBulletById(id),
		query: (id) => bulletQueries.byId(id),
		routeId: (b) => b.granblueId,
		noun: m.db_bullets_noun,
		image: (b) => getBulletImage(b.granblueId)
	},

	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (b, payload) =>
			bulletAdapter.updateBullet(b.granblueId, payload as Partial<BulletPayload>),
		create: (payload) => bulletAdapter.createBullet(payload as unknown as BulletPayload),
		// The party editor's bullet picker reads the public list
		invalidates: () => [bulletKeys.all]
	},

	section: bulletsSection
})
