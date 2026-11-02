/**
 * Parity: the stickers resource must keep what the hand-written sticker pages
 * did (baseline: the new and edit pages' fields and payloads, transcribed
 * below), with the changes decided for GBF-143: the slug follows the API's
 * format, the edit payload also carries the (unchanged) slug, and images are
 * uploaded from the edit form rather than chosen before creating.
 */
import { describe, expect, it, vi } from 'vitest'
import {
	formSections,
	fromRecord,
	initialValues,
	toPayload
} from '$lib/features/database/schema/form'
import { detailLayout } from '$lib/features/database/schema/detail'
import { buildZod, issueErrors } from '$lib/features/database/schema/validation'
import type { AdminStickerRow } from '$lib/types/api/admin'
import { stickersResource as def, type StickerRecord } from './resource'

const thanks: StickerRecord = {
	id: '572fd30c-83f0-4264-9542-cc1e8892d16e',
	slug: 'stamp-9',
	meaning: { en: 'Thanks!', ja: 'ありがとう' },
	imageUrl: 'icons/stickers/stamp9.png?v=1',
	imageUrlJa: 'icons/stickers/stamp9.ja.png?v=1',
	position: 0,
	active: true,
	deletable: false,
	name: { en: 'Thanks!', ja: 'ありがとう' }
}

const keys = (mode: 'edit' | 'create') =>
	formSections(def, mode).map((s) => [s.section.id, s.fields.map((f) => f.key)])

describe('stickers resource: forms', () => {
	it("keeps the old pages' sections: details, the game's stickers, then images", () => {
		expect(keys('edit')).toEqual([
			['details', ['slug', 'meaning', 'active']],
			['library', ['library_id']],
			['images', ['images']]
		])
		// Uploads need a saved sticker: the create form picks from the game's
		expect(keys('create')).toEqual([
			['details', ['slug', 'meaning', 'active']],
			['library', ['library_id']]
		])
	})

	it("sends the old edit page's payload, plus the unchanged slug", () => {
		expect(toPayload(def, fromRecord(def, thanks), 'edit')).toEqual({
			slug: 'stamp-9',
			meaning_en: 'Thanks!',
			meaning_jp: 'ありがとう',
			active: true
		})
	})

	it('sends library_id only when a game sticker is picked', () => {
		const values = { ...fromRecord(def, thanks), library_id: 12 }
		expect(toPayload(def, values, 'edit')).toMatchObject({ library_id: 12 })
		expect(toPayload(def, fromRecord(def, thanks), 'edit')).not.toHaveProperty('library_id')
	})

	it('starts the create form active, like the old new page, and sends what it sent', () => {
		const values = {
			...initialValues(def),
			slug: 'stamp-12',
			meaning: { en: 'Full auto', ja: 'フルオート' },
			library_id: 12
		}
		expect(toPayload(def, values, 'create')).toEqual({
			slug: 'stamp-12',
			meaning_en: 'Full auto',
			meaning_jp: 'フルオート',
			active: true,
			library_id: 12
		})
	})

	it('never sends the images or the position', () => {
		const payload = toPayload(def, fromRecord(def, thanks), 'edit')
		expect(payload).not.toHaveProperty('images')
		expect(payload).not.toHaveProperty('position')
	})

	it('requires both meanings and a slug in the API format', () => {
		const result = buildZod(def, 'create').safeParse({
			...initialValues(def),
			slug: 'Bad_Slug',
			meaning: { en: 'Thanks!', ja: '' }
		})
		expect(result.success).toBe(false)
		expect(Object.keys(issueErrors(result.error!.issues)).sort()).toEqual(['meaning.ja', 'slug'])
	})
})

describe('stickers resource: detail, list and delete', () => {
	it('shows the images and the times given with the details', () => {
		const { blocks } = detailLayout(def, thanks)
		expect(blocks.map((b) => [b.section.id, b.rows.map((r) => r.field.key)])).toEqual([
			['details', ['images', 'meaning', 'slug', 'active', 'position', 'given_count']]
		])
	})

	it('names the record by its meaning, for the header and breadcrumb', async () => {
		const { stickerAdapter } = await import('$lib/api/adapters/sticker.adapter')
		const spy = vi.spyOn(stickerAdapter, 'getSticker').mockResolvedValueOnce(thanks)
		expect((await def.record!.fetch('stamp-9')).name).toEqual(thanks.meaning)
		spy.mockRestore()
	})

	it('is an ordered list: by position, inactive rows dimmed, reordered by id', async () => {
		const ordered = def.list.ordered!
		expect(ordered.field).toBe('position')
		expect(ordered.inactive!({ active: false } as AdminStickerRow)).toBe(true)
		expect(ordered.inactive!({ active: true } as AdminStickerRow)).toBe(false)
		expect(
			ordered.subtitle!({ meaningJp: 'ありがとう', slug: 'stamp-9' } as AdminStickerRow)
		).toEqual(['ありがとう', 'stamp-9'])
		const { stickerAdapter } = await import('$lib/api/adapters/sticker.adapter')
		const spy = vi.spyOn(stickerAdapter, 'reorderStickers').mockResolvedValueOnce([])
		await ordered.reorder([{ id: 'b' }, { id: 'a' }] as AdminStickerRow[])
		expect(spy).toHaveBeenCalledWith(['b', 'a'])
		spy.mockRestore()
	})

	it('addresses rows and records by slug, in picker order', () => {
		expect(def.list.rowId!({ slug: 'stamp-9' } as AdminStickerRow)).toBe('stamp-9')
		expect(def.record!.routeId(thanks)).toBe('stamp-9')
		expect(def.list.defaultSort).toEqual([
			{ id: 'position', desc: false },
			{ id: 'created_at', desc: false }
		])
	})

	it('disables Delete once the sticker has been given', () => {
		expect(def.save!.canDestroy!(thanks)).toBeTypeOf('function')
		expect(def.save!.canDestroy!({ ...thanks, deletable: true })).toBe(true)
	})
})
