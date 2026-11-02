/**
 * The sticker catalogue (GBF-143): the stickers members give to teams,
 * keyed by slug, which also names each one's image files. Editors order them
 * by hand (the picker's order), take the images from one of the game's own
 * stickers or upload their own, and retire them with `active`. A sticker
 * someone has given can't be deleted.
 */
import { queryOptions } from '@tanstack/svelte-query'
import { z } from 'zod'
import * as m from '$lib/paraglide/messages'
import { stickerAdapter } from '$lib/api/adapters/sticker.adapter'
import { stickerKeys } from '$lib/api/queries/sticker.queries'
import { SLUG } from '$lib/features/database/schema/sluggedFields'
import { defineResource } from '$lib/features/database/schema/types'
import StickerThumbnail from '$lib/features/database/stickers/StickerThumbnail.svelte'
import { stickersSection } from '$lib/features/database/stickers/section'
import type { AdminStickerRow } from '$lib/types/api/admin'
import type { LocalizedName } from '$lib/types/api/entities'
import type { Sticker, StickerPayload } from '$lib/types/api/sticker'
import { getHostedImageUrl } from '$lib/utils/images/core'
import { appLocale } from '$lib/utils/locale'
import { stickerImageUrl } from '$lib/utils/stickers'

const required = () => m.db_field_required()

/**
 * A sticker as the detail and edit pages hold it: its meaning doubles as its
 * name, which the page header and the breadcrumb show
 */
export type StickerRecord = Sticker & { name: LocalizedName }

const asRecord = (sticker: Sticker): StickerRecord => ({ ...sticker, name: sticker.meaning })

export const stickersResource = defineResource<AdminStickerRow, StickerRecord>({
	name: 'stickers',
	fields: [
		{
			key: 'images',
			kind: 'custom',
			label: m.db_stickers_field_images,
			read: (s) => s.imageUrl,
			write: false,
			// Uploads need the saved sticker; the create form picks from the game's
			form: { create: false },
			render: { detail: 'stickerImages', input: 'stickerImages' }
		},
		{
			key: 'library_id',
			kind: 'custom',
			label: m.db_stickers_section_library,
			// Only sent when a game sticker is picked
			empty: 'omit',
			detail: false,
			render: { input: 'stickerLibrary' }
		},
		{
			key: 'meaning',
			kind: 'localized',
			label: m.db_stickers_field_meaning,
			keys: { en: 'meaning_en', ja: 'meaning_jp' },
			labels: { en: m.db_stickers_field_meaning_en, ja: m.db_stickers_field_meaning_jp },
			required: true,
			// The picker shows the meaning in the viewer's language, so both are needed
			validate: z.object({
				ja: z.string().refine((v) => v.trim() !== '', { error: required })
			})
		},
		{
			key: 'slug',
			kind: 'code',
			label: m.db_stickers_field_slug,
			required: true,
			validate: z.string().regex(SLUG, { error: () => m.db_field_slug_invalid() }),
			form: { placeholder: m.db_field_slug_placeholder, width: '240px' },
			// Fixed once created: it names the image files
			render: { input: 'stickerSlug' }
		},
		{
			key: 'active',
			kind: 'boolean',
			label: m.db_stickers_field_active,
			default: true
		},
		{
			key: 'position',
			kind: 'number',
			label: m.db_stickers_field_position,
			int: true,
			// Set by dragging the list
			write: false
		},
		{
			// How many teams carry it; a given sticker can't be deleted
			key: 'given_count',
			kind: 'number',
			label: m.db_stickers_field_given_count,
			int: true,
			write: false
		}
	],

	list: {
		label: m.nav_stickers,
		entity: m.db_stickers_entity,
		empty: m.db_stickers_empty,
		title: 'meaning',
		rowId: (s) => s.slug,
		columns: [],
		filters: [],
		baseFields: ['slug', 'meaning_en', 'meaning_jp', 'image_url', 'image_url_ja', 'active'],
		// Most stickers share a position until the list is first dragged
		defaultSort: [
			{ id: 'position', desc: false },
			{ id: 'created_at', desc: false }
		],
		// The picker's order, set by dragging; retired stickers stay in place, dimmed
		ordered: {
			field: 'position',
			reorder: (rows) => stickerAdapter.reorderStickers(rows.map((r) => r.id)),
			inactive: (r) => !r.active,
			thumbnail: StickerThumbnail,
			subtitle: (r) => [r.meaningJp, r.slug],
			// The picker, the labels and the team pages read the public catalogue
			invalidates: () => [stickerKeys.all]
		}
	},

	layout: {
		detail: [
			{
				id: 'details',
				title: m.db_stickers_section_details,
				fields: ['images', 'meaning', 'slug', 'active', 'position', 'given_count']
			}
		],
		edit: [
			{
				id: 'details',
				title: m.db_stickers_section_details,
				fields: ['slug', 'meaning', 'active']
			},
			{ id: 'library', title: m.db_stickers_section_library, fields: ['library_id'] },
			{ id: 'images', title: m.db_stickers_section_image, fields: ['images'] }
		]
	},

	record: {
		fetch: (slug, options) => stickerAdapter.getSticker(slug, options).then(asRecord),
		query: (slug) =>
			queryOptions({
				queryKey: stickerKeys.detail(slug),
				queryFn: () => stickerAdapter.getSticker(slug).then(asRecord)
			}),
		routeId: (s) => s.slug,
		noun: m.db_stickers_type,
		image: (s) => getHostedImageUrl(stickerImageUrl(s, appLocale())) ?? ''
	},

	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (s, payload) =>
			stickerAdapter
				.updateSticker(s.id, payload as unknown as Partial<StickerPayload>)
				.then(asRecord),
		create: (payload) =>
			stickerAdapter.createSticker(payload as unknown as StickerPayload).then(asRecord),
		destroy: (s) => stickerAdapter.deleteSticker(s.id),
		canDestroy: (s) => s.deletable !== false || m.db_stickers_delete_hint,
		// The picker, the labels and the team pages read the public catalogue
		invalidates: () => [stickerKeys.all]
	},

	section: stickersSection
})
