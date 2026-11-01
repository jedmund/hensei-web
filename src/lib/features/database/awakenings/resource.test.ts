/**
 * Parity: the awakenings resource must keep what the Awakenings view on the
 * weapons list and its edit dialog did: the view's columns, and the dialog's
 * payload (transcribed below), with the changes decided for GBF-143 applied:
 * character awakenings are listed too (filtered by Type), the type is the
 * record's own rather than always Weapon, and blanks are sent as null.
 */
import { describe, expect, it } from 'vitest'
import { columnHeader } from '$lib/components/data-table/types'
import { columnsFor, filtersFor } from '$lib/features/database/schema/columns'
import {
	formSections,
	fromRecord,
	initialValues,
	toPayload
} from '$lib/features/database/schema/form'
import { buildZod, issueErrors } from '$lib/features/database/schema/validation'
import type { AdminAwakeningRow } from '$lib/types/api/admin'
import type { Awakening } from '$lib/types/api/entities'
import { awakeningsResource as def } from './resource'

const atk: Awakening = {
	id: 'a-atk',
	name: { en: 'Attack', ja: '攻撃' },
	slug: 'weapon-atk',
	objectType: 'Weapon',
	order: 1
}
const multi: Awakening = {
	id: 'a-multi',
	name: { en: 'Multiattack', ja: '連撃' },
	slug: 'character-multi',
	objectType: 'Character',
	order: 3
}

describe('awakenings resource: list', () => {
	it("keeps the view's Image, Order, Name, Slug and Type columns", () => {
		const columns = columnsFor(def)
		expect(columns.map((c) => [c.id, columnHeader(c), c.defaultHidden ?? false])).toEqual([
			['image', '', false],
			['order', 'Order', false],
			['name', 'Name', false],
			['slug', 'Slug', false],
			['object_type', 'Type', false],
			['updated_at', 'Last edited', true]
		])
		// The icon is drawn from the slug
		expect(columns[0]).toMatchObject({ type: 'component', fields: ['slug'] })
	})

	it('lists weapon awakenings by order, after character ones, filtered by type', () => {
		expect(def.list.defaultSort).toEqual([
			{ id: 'object_type', desc: false },
			{ id: 'order', desc: false }
		])
		expect(filtersFor(def).map((f) => (f.kind === 'toggles' ? f.id : f.key))).toEqual([
			'object_type'
		])
		expect(def.list.rowId!({ slug: 'weapon-atk' } as AdminAwakeningRow)).toBe('weapon-atk')
	})
})

describe('awakenings resource: payload parity', () => {
	it("matches the dialog's payload, with the record's own type", () => {
		const payload = (a: Awakening) => toPayload(def, fromRecord(def, a), 'edit')
		expect(payload(atk)).toEqual({
			name_en: 'Attack',
			name_jp: '攻撃',
			slug: 'weapon-atk',
			object_type: 'Weapon',
			order: 1
		})
		expect(payload(multi).object_type).toBe('Character')
	})

	it("starts from the dialog's defaults: a weapon awakening at order 0", () => {
		const values = { ...initialValues(def), name: { en: 'Heal', ja: '回復' }, slug: 'weapon-heal' }
		expect(toPayload(def, values, 'create')).toEqual({
			name_en: 'Heal',
			name_jp: '回復',
			slug: 'weapon-heal',
			object_type: 'Weapon',
			order: 0
		})
	})

	it('uploads the icon from the edit form, never sending it', () => {
		const keys = (mode: 'edit' | 'create') =>
			formSections(def, mode).flatMap((s) => s.fields.map((f) => f.key))
		expect(keys('edit')).toContain('image')
		expect(keys('create')).not.toContain('image')
		expect(toPayload(def, fromRecord(def, atk), 'edit')).not.toHaveProperty('image')
	})

	it('requires both names, a path-safe slug and a known type', () => {
		const result = buildZod(def, 'edit').safeParse({
			...fromRecord(def, atk),
			name: { en: 'Attack', ja: '' },
			slug: '../weapon-atk',
			object_type: 'Summon'
		})
		expect(result.success).toBe(false)
		expect(Object.keys(issueErrors(result.error!.issues)).sort()).toEqual([
			'name.ja',
			'object_type',
			'slug'
		])
	})
})
