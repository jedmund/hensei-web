/**
 * The fields a slug-keyed resource (a series, an awakening) shares: its
 * name, slug and sort order, as the API's Slugged models validate them.
 * Spread them into a definition's `fields`; its `routeId` and `list.rowId`
 * are the slug.
 */
import { z } from 'zod'
import * as m from '$lib/paraglide/messages'
import type { Field } from './types'

/** Lowercase words joined by single hyphens: the API's Slugged::FORMAT */
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** `name`, `slug` and `order`, keyed and labelled the same on every resource */
export const sluggedFields: Field[] = [
	{
		key: 'name',
		kind: 'localized',
		label: m.db_weapon_series_col_name,
		keys: { en: 'name_en', ja: 'name_jp' },
		labels: { en: m.db_field_name_en, ja: m.db_field_name_ja },
		required: true,
		// The API needs the Japanese name too
		validate: z.object({
			ja: z.string().refine((v) => v.trim() !== '', { error: () => m.db_field_required() })
		}),
		list: { primary: true, minWidth: '200px' }
	},
	{
		key: 'slug',
		kind: 'code',
		label: m.db_field_slug,
		required: true,
		validate: z.string().regex(SLUG, { error: () => m.db_field_slug_invalid() }),
		form: { placeholder: m.db_field_slug_placeholder, width: '240px' },
		list: { minWidth: '150px' }
	},
	{
		key: 'order',
		kind: 'number',
		label: m.db_field_order,
		int: true,
		default: 0,
		required: true,
		list: { width: '80px', align: 'center' }
	}
]
