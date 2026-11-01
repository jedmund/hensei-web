/**
 * The awakenings resource (GBF-143): weapon and character awakenings, keyed
 * by slug, which also names each one's icon. The edit form uploads the icon.
 */
import * as m from '$lib/paraglide/messages'
import {
	awakeningAdapter,
	type CreateAwakeningPayload,
	type UpdateAwakeningPayload
} from '$lib/api/adapters/awakening.adapter'
import { entityKeys, entityQueries } from '$lib/api/queries/entity.queries'
import AwakeningIconCell from '$lib/components/database/cells/AwakeningIconCell.svelte'
import { awakeningsSection } from '$lib/features/database/awakenings/section'
import { sluggedFields } from '$lib/features/database/schema/sluggedFields'
import { defineResource, type EnumOption } from '$lib/features/database/schema/types'
import type { AdminAwakeningRow } from '$lib/types/api/admin'
import type { Awakening } from '$lib/types/api/entities'

const objectTypeOptions = (): EnumOption[] => [
	{ value: 'Weapon', label: m.db_awakenings_type_weapon },
	{ value: 'Character', label: m.db_awakenings_type_character }
]

export const awakeningsResource = defineResource<AdminAwakeningRow, Awakening>({
	name: 'awakenings',
	fields: [
		{
			key: 'image',
			kind: 'custom',
			label: m.db_awakenings_field_image,
			read: (a) => a.slug,
			write: false,
			// Uploads need the saved awakening
			form: { create: false },
			render: { cell: AwakeningIconCell, detail: 'awakeningImage', input: 'awakeningImage' },
			list: {
				header: () => '',
				sortable: false,
				hideable: false,
				width: '60px',
				align: 'center',
				fields: ['slug']
			}
		},
		...sluggedFields,
		{
			key: 'object_type',
			kind: 'enum',
			label: m.db_awakenings_field_object_type,
			options: objectTypeOptions,
			default: 'Weapon',
			required: true,
			list: { width: '100px' },
			filter: { kind: 'multi', facet: true }
		},
		{
			key: 'updated_at',
			kind: 'datetime',
			label: m.db_field_updated_at,
			write: false,
			detail: false,
			list: { defaultHidden: true }
		}
	],

	list: {
		label: m.db_awakenings_label,
		entity: m.db_awakenings_entity,
		empty: m.db_awakenings_empty,
		title: 'name',
		rowId: (a) => a.slug,
		columns: ['image', 'order', 'name', 'slug', 'object_type', 'updated_at'],
		filters: ['object_type'],
		baseFields: ['slug', 'name_en', 'name_jp'],
		defaultSort: [
			{ id: 'object_type', desc: false },
			{ id: 'order', desc: false }
		]
	},

	layout: {
		detail: [
			{
				id: 'basic',
				title: m.db_section_basic,
				fields: ['image', 'name', 'slug', 'object_type', 'order']
			}
		]
	},

	record: {
		fetch: (slug) => awakeningAdapter.getAwakening(slug),
		query: (slug) => entityQueries.awakening(slug),
		routeId: (a) => a.slug,
		noun: m.db_awakenings_noun
	},

	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (a, payload) =>
			awakeningAdapter.updateAwakening(a.id, payload as UpdateAwakeningPayload),
		create: (payload) =>
			awakeningAdapter.createAwakening(payload as unknown as CreateAwakeningPayload),
		// Weapon and character forms read the awakening lists
		invalidates: () => [entityKeys.allAwakenings()]
	},

	section: awakeningsSection
})
