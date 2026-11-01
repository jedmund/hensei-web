/**
 * Parity: the bullets resource must reproduce what the hand-written bullet
 * pages did: the old wx grid's columns, and the edit and new pages' payloads
 * (transcribed below), with the changes decided for GBF-143 applied on top.
 */
import { describe, expect, it, vi } from 'vitest'
import { bulletAdapter } from '$lib/api/adapters/bullet.adapter'
import { columnHeader } from '$lib/components/data-table/types'
import { columnsFor, filtersFor } from '$lib/features/database/schema/columns'
import { recordHref } from '$lib/features/database/schema/detail'
import {
	formSections,
	fromRecord,
	initialValues,
	toPayload
} from '$lib/features/database/schema/form'
import { buildZod, issueErrors, issueMessage } from '$lib/features/database/schema/validation'
import type { Values } from '$lib/features/database/schema/types'
import type { Bullet } from '$lib/types/api/entities'
import type { AdminBulletRow } from '$lib/types/api/admin'
import { bulletsResource as def } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'

const { iron, shotshell, neptune } = detailRecords

const row: AdminBulletRow = {
	id: 'b-neptune',
	granblueId: '40801',
	nameEn: 'Neptune Point',
	nameJp: 'ネプチューンポイント',
	slug: 'neptune-point',
	bulletType: 4,
	atk: 65,
	hitsAll: false,
	order: 96,
	effectEn: 'Chance for each ally to gain Water ATK Boosted (Stackable).',
	effectJp: null,
	updatedAt: '2026-10-01T00:00:00Z'
}

describe('bullets resource: list', () => {
	const columns = columnsFor(def)
	const column = (id: string) => columns.find((c) => c.id === id)!

	// The old grid: image, Name, Type, ATK, Hits All, Effect. The rest are new and hidden
	it("keeps the old grid's columns, with the rest hidden", () => {
		expect(columns.map((c) => [c.id, columnHeader(c), c.defaultHidden ?? false])).toEqual([
			['image', '', false],
			['name', 'Name', false],
			['bullet_type', 'Type', false],
			['atk', 'ATK', false],
			['hits_all', 'Hits All', false],
			['effect', 'Effect', false],
			['order', 'Order', true],
			['granblue_id', 'Granblue ID', true],
			['slug', 'Slug', true],
			['updated_at', 'Last edited', true]
		])
	})

	// The old grid showed only the English effect; the cell now shows both, like names
	it('reads the type and the effect from a row', () => {
		expect(column('bullet_type').value!(row)).toBe('Aetherial')
		const effect = column('effect')
		expect(effect.type === 'name' && effect.name(row)).toEqual({ en: row.effectEn, ja: null })
		expect(effect.sortable).toBe(false)
	})

	it('filters on type, hits all and edits (the old grid only searched)', () => {
		expect(filtersFor(def).map((f) => (f.kind === 'toggles' ? f.id : f.key))).toEqual([
			'bullet_type',
			'properties',
			'updated_at'
		])
	})

	it('sorts by type, then order, like the old grid, and links by Granblue ID', () => {
		expect(def.list.defaultSort).toEqual([
			{ id: 'bullet_type', desc: false },
			{ id: 'order', desc: false }
		])
		expect(def.list.baseFields).toContain('granblue_id')
		expect(recordHref(def, iron)).toBe('/database/bullets/10101')
	})
})

// --- Edit and new: the old pages, transcribed ---

/** The edit and new pages' payload (both built the same object) */
function legacyPayload(bullet: Bullet) {
	return {
		name_en: bullet.name?.en || '',
		name_jp: bullet.name?.ja || undefined,
		effect_en: bullet.effect?.en || undefined,
		effect_jp: bullet.effect?.ja || undefined,
		granblue_id: bullet.granblueId || undefined,
		slug: bullet.slug || '',
		bullet_type: bullet.bulletType || 1,
		atk: bullet.atk || 0,
		hits_all: bullet.hitsAll || false,
		order: bullet.order || 0
	}
}

const editPayload = (bullet: Bullet) => toPayload(def, fromRecord(def, bullet), 'edit')

describe('bullets resource: edit payload parity', () => {
	// Decided: a blank text field sends null (clearing it) rather than nothing
	it('matches the edit page, with blanks sent as null', () => {
		expect(editPayload(neptune)).toEqual({ ...legacyPayload(neptune), effect_jp: null })
		expect(editPayload(iron)).toEqual({ ...legacyPayload(iron), effect_en: null, effect_jp: null })
		expect(editPayload(shotshell)).toMatchObject({ bullet_type: 3, hits_all: true, atk: 35 })
	})
})

describe('bullets resource: create', () => {
	it("sends the new page's keys", () => {
		const sent = Object.keys(toPayload(def, initialValues(def), 'create'))
		expect(sent.toSorted()).toEqual(Object.keys(legacyPayload(iron)).toSorted())
	})

	it('starts from the new page defaults: a Parabellum, ATK and order 0, not hitting all', () => {
		expect(initialValues(def)).toMatchObject({
			bullet_type: 1,
			atk: 0,
			order: 0,
			hits_all: false
		})
	})
})

describe('bullets resource: delete', () => {
	it('deletes by Granblue ID, leaving in-use checks to the API', async () => {
		const deleteBullet = vi.spyOn(bulletAdapter, 'deleteBullet').mockResolvedValue()
		await def.save!.destroy!(neptune)
		expect(deleteBullet).toHaveBeenCalledWith('40801')
		expect(def.save!.canDestroy).toBeUndefined()
	})
})

describe('bullets resource: forms', () => {
	it('edit every writable field in the detail layout', () => {
		expect(
			formSections(def, 'edit').map(({ section, fields }) => [section.id, fields.map((f) => f.key)])
		).toEqual([
			['metadata', ['name', 'granblue_id', 'slug']],
			['properties', ['bullet_type', 'atk', 'hits_all', 'order']],
			['effect', ['effect']]
		])
	})
})

function errors(values: Values, mode: 'edit' | 'create' = 'edit') {
	const result = buildZod(def, mode).safeParse(values, { error: issueMessage })
	return result.success ? {} : issueErrors(result.error.issues)
}

describe('bullets resource: validation', () => {
	it('accepts loaded bullets', () => {
		for (const bullet of [iron, shotshell, neptune]) {
			expect(errors(fromRecord(def, bullet))).toEqual({})
		}
	})

	it('requires a five-digit Granblue ID, a kebab-case slug and whole numbers from 0', () => {
		expect(
			errors({
				...fromRecord(def, iron),
				granblue_id: '1010',
				slug: 'Iron Bullet',
				atk: -1,
				order: 1.5
			})
		).toMatchObject({
			granblue_id: 'Granblue ID must be 5 digits',
			slug: 'Use lowercase letters and numbers, joined by single hyphens',
			atk: 'Must be at least 0',
			order: 'Must be a whole number'
		})
	})

	// The old new page sent a blank Granblue ID as nothing; the API now requires one
	it('requires an English name, a slug and a Granblue ID on create', () => {
		expect(errors(initialValues(def), 'create')).toMatchObject({
			granblue_id: 'Required',
			slug: 'Required'
		})
	})
})
