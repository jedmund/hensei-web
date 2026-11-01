/**
 * Parity: the weapon series resource must reproduce what the hand-written
 * pages did: the Series view's columns on the weapons list, and the edit and
 * new pages' payloads (transcribed below), with the changes decided for
 * GBF-143 applied on top.
 */
import { describe, expect, it } from 'vitest'
import { columnHeader } from '$lib/components/data-table/types'
import { columnsFor, filtersFor } from '$lib/features/database/schema/columns'
import { recordHref } from '$lib/features/database/schema/detail'
import {
	formSections,
	fromRecord,
	initialValues,
	toPayload
} from '$lib/features/database/schema/form'
import { buildZod, issueErrors } from '$lib/features/database/schema/validation'
import type { Values } from '$lib/features/database/schema/types'
import type { AdminWeaponSeriesRow } from '$lib/types/api/admin'
import type { WeaponSeries } from '$lib/types/api/weaponSeries'
import { weaponSeriesResource as def } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'

const { keyed, variants, plain } = detailRecords

describe('weapon series resource: list', () => {
	const columns = columnsFor(def)
	const column = (id: string) => columns.find((c) => c.id === id)!

	it("keeps the Series view's columns, the rest hidden", () => {
		expect(columns.map((c) => [c.id, columnHeader(c), c.defaultHidden ?? false])).toEqual([
			['order', 'Order', false],
			['name', 'Name', false],
			['slug', 'Slug', false],
			['flags', 'Flags', false],
			['extra', 'Extra Grid', true],
			['element_changeable', 'Element Changeable', true],
			['has_weapon_keys', 'Has Weapon Keys', true],
			['has_awakening', 'Has Awakening', true],
			['num_weapon_keys', 'Weapon Key Slots', true],
			['augment_type', 'Augment Type', true],
			['weapon_count', 'Weapon Count', true],
			['updated_at', 'Last edited', true]
		])
		expect(column('order')).toMatchObject({ type: 'number', width: '80px', align: 'center' })
		expect(column('name')).toMatchObject({ type: 'name', primary: true, minWidth: '200px' })
		expect(column('slug')).toMatchObject({ type: 'code', minWidth: '150px' })
		expect(column('flags')).toMatchObject({ type: 'flags', minWidth: '200px' })
	})

	it('draws the flags the Series view drew, now with AX and befoulment from the augment type', () => {
		const flags = column('flags') as { flags: (row: AdminWeaponSeriesRow) => { label: string }[] }
		const row = (r: Partial<AdminWeaponSeriesRow>) => r as AdminWeaponSeriesRow
		expect(
			flags
				.flags(
					row({
						extra: true,
						elementChangeable: true,
						hasWeaponKeys: true,
						hasAwakening: true,
						augmentType: 'ax'
					})
				)
				.map((f) => f.label)
		).toEqual(['Extra', 'Element', 'Keys', 'Awaken', 'AX'])
		expect(flags.flags(row({ augmentType: 'befoulment' })).map((f) => f.label)).toEqual(['Befoul'])
		expect(flags.flags(row({ augmentType: 'no_augment' }))).toEqual([])
	})

	it('filters on the augment type and the flags, sorted by order, rows by slug', () => {
		expect(filtersFor(def).map((f) => (f.kind === 'toggles' ? f.id : f.key))).toEqual([
			'augment_type',
			'flags'
		])
		expect(def.list.defaultSort).toEqual([{ id: 'order', desc: false }])
		expect(def.list.rowId!({ slug: 'dark-opus' } as AdminWeaponSeriesRow)).toBe('dark-opus')
	})
})

/** The edit page's payload, transcribed from series/weapons/[slug]/edit */
function oldEditPayload(series: WeaponSeries): Values {
	return {
		name_en: series.name.en || '',
		name_jp: series.name.ja || '',
		slug: series.slug || '',
		order: series.order || 0,
		extra: series.extra || false,
		element_changeable: series.elementChangeable || false,
		has_weapon_keys: series.hasWeaponKeys || false,
		has_awakening: series.hasAwakening || false,
		augment_type: series.augmentType || 'no_augment',
		num_weapon_keys: series.numWeaponKeys ?? null
	}
}

describe('weapon series resource: edit payload parity', () => {
	const payload = (series: WeaponSeries) => toPayload(def, fromRecord(def, series), 'edit')

	it('matches the edit page', () => {
		expect(payload(keyed)).toEqual(oldEditPayload(keyed))
		expect(payload(variants)).toEqual(oldEditPayload(variants))
	})

	it('sends a blank Japanese name as null, and clears key slots without keys', () => {
		expect(payload(plain)).toEqual({ ...oldEditPayload(plain), name_jp: null })
		const values = { ...fromRecord(def, keyed), has_weapon_keys: false }
		expect(toPayload(def, values, 'edit').num_weapon_keys).toBeNull()
	})

	it('goes to the series page by its new slug after a save', () => {
		expect(recordHref(def, { ...keyed, slug: 'opus' })).toBe('/database/weapon-series/opus')
	})
})

describe('weapon series resource: create payload parity', () => {
	it("starts from the new page's defaults and sends its keys", () => {
		const values = {
			...initialValues(def),
			name: { en: 'Abyssal', ja: 'アビス' },
			slug: 'abyssal'
		}
		// The new page sent the key slots whatever the keys; hidden, they're cleared
		expect(toPayload(def, values, 'create')).toEqual({
			name_en: 'Abyssal',
			name_jp: 'アビス',
			slug: 'abyssal',
			order: 0,
			extra: false,
			element_changeable: false,
			has_weapon_keys: false,
			has_awakening: false,
			augment_type: 'no_augment',
			num_weapon_keys: null
		})
	})

	it('edits variants on the edit form only, where the series exists', () => {
		const keys = (mode: 'edit' | 'create') =>
			formSections(def, mode).flatMap((s) => s.fields.map((f) => f.key))
		expect(keys('edit')).toContain('variants')
		expect(keys('create')).not.toContain('variants')
		expect(keys('create')).not.toContain('weapon_count')
	})
})

describe('weapon series resource: validation', () => {
	const errors = (values: Values) => {
		const result = buildZod(def, 'edit').safeParse(values)
		return result.success ? {} : issueErrors(result.error.issues)
	}

	it('accepts loaded series', () => {
		expect(errors(fromRecord(def, keyed))).toEqual({})
	})

	it('requires both names and a lowercase hyphenated slug, as the API does', () => {
		const values = { ...fromRecord(def, keyed), name: { en: 'Opus', ja: ' ' }, slug: 'Dark Opus' }
		expect(Object.keys(errors(values)).sort()).toEqual(['name.ja', 'slug'])
	})

	it('takes whole-number key slots', () => {
		expect(errors({ ...fromRecord(def, keyed), num_weapon_keys: 1.5 })).toHaveProperty(
			'num_weapon_keys'
		)
	})
})
