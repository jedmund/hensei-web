/**
 * Parity: the character roles resource must reproduce what the hand-written
 * roles pages did: the list's order and lines, the reorder body, and the edit
 * and new pages' payloads (transcribed below).
 */
import { describe, expect, it, vi } from 'vitest'
import { roleAdapter } from '$lib/api/adapters/role.adapter'
import { roleKeys } from '$lib/api/queries/role.queries'
import { titleFor } from '$lib/features/database/schema/columns'
import { recordHref, recordTitle } from '$lib/features/database/schema/detail'
import {
	formSections,
	fromRecord,
	initialValues,
	toPayload
} from '$lib/features/database/schema/form'
import { buildZod, issueErrors } from '$lib/features/database/schema/validation'
import type { AdminCharacterRoleRow } from '$lib/types/api/admin'
import { toRoleRecord } from './record'
import { characterRolesResource as def } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'

const attacker = toRoleRecord(detailRecords.full)
const healer = toRoleRecord(detailRecords.empty)

const row = (r: Partial<AdminCharacterRoleRow>): AdminCharacterRoleRow => ({
	id: 'r',
	nameEn: 'Attacker',
	nameJp: 'アタッカー',
	sortOrder: 1,
	iconKey: null,
	...r
})

describe('character roles resource: ordered list', () => {
	const ordered = def.list.ordered!

	it('lists every role by sort order, like the old page', () => {
		expect(ordered.field).toBe('sort_order')
		expect(def.list.defaultSort).toEqual([
			{ id: 'sort_order', desc: false },
			{ id: 'name_en', desc: false }
		])
		expect(def.list.columns).toEqual([])
		expect(def.list.baseFields).toEqual(['name_en', 'name_jp', 'sort_order', 'icon_key'])
	})

	it('draws the English name over the Japanese one, keyed by id', () => {
		const r = row({ id: 'x1' })
		expect(titleFor(def)(r)).toBe('Attacker')
		expect(ordered.subtitle?.(r)).toEqual(['アタッカー'])
		expect(def.list.rowId?.(r)).toBe('x1')
		expect(ordered.inactive).toBeUndefined()
	})

	it('saves positions from 1, as the old page did', async () => {
		const reorder = vi.spyOn(roleAdapter, 'reorderRoles').mockResolvedValue([])
		await ordered.reorder([row({ id: 'b' }), row({ id: 'a' }), row({ id: 'c' })])
		expect(reorder).toHaveBeenCalledWith([
			{ id: 'b', sortOrder: 1 },
			{ id: 'a', sortOrder: 2 },
			{ id: 'c', sortOrder: 3 }
		])
		reorder.mockRestore()
	})

	it("refreshes the party sidebar's role list after a reorder or a save", () => {
		expect(ordered.invalidates?.()).toEqual([roleKeys.all])
		expect(def.save?.invalidates?.()).toEqual([roleKeys.all])
	})
})

// --- Forms: the old pages, transcribed ---

/** The old edit and new pages' payload (before the adapter snake_cased it) */
function legacy(values: { nameEn: string; nameJp: string }) {
	return { name_en: values.nameEn.trim(), name_jp: values.nameJp.trim() || null }
}

describe('character roles resource: payload parity', () => {
	it('edits the names, as the edit page did', () => {
		expect(toPayload(def, fromRecord(def, attacker), 'edit')).toEqual(
			legacy({ nameEn: 'Attacker', nameJp: 'アタッカー' })
		)
		expect(toPayload(def, fromRecord(def, healer), 'edit')).toEqual(
			legacy({ nameEn: 'Healer', nameJp: '' })
		)
	})

	it('creates with the names only; the API puts a new role last', () => {
		const values = { ...initialValues(def), name: { en: 'Breaker', ja: '' } }
		expect(toPayload(def, values, 'create')).toEqual(legacy({ nameEn: 'Breaker', nameJp: '' }))
	})

	it('requires the English name, like the new page', () => {
		const schema = buildZod(def, 'create')
		const result = schema.safeParse({ ...initialValues(def), name: { en: ' ', ja: 'ヒーラー' } })
		expect(result.success).toBe(false)
		expect(Object.keys(issueErrors(result.error!.issues))).toEqual(['name.en'])
	})
})

describe('character roles resource: delete', () => {
	it('deletes by id from the edit form, always allowed, as the edit page did', async () => {
		const remove = vi.spyOn(roleAdapter, 'deleteRole').mockResolvedValue()
		await def.save?.destroy?.(attacker)
		expect(remove).toHaveBeenCalledWith(attacker.id)
		expect(def.save?.canDestroy).toBeUndefined()
		remove.mockRestore()
	})
})

describe('character roles resource: layout and record', () => {
	it('edits the names and the icon; creating takes the names only', () => {
		const shape = (mode: 'edit' | 'create') =>
			formSections(def, mode).map(({ section, fields }) => [section.id, fields.map((f) => f.key)])
		expect(shape('edit')).toEqual([['details', ['name', 'icon']]])
		expect(shape('create')).toEqual([['details', ['name']]])
	})

	it('pages each role by its id, titled by its English name', () => {
		expect(recordHref(def, attacker)).toBe(`/database/character-roles/${attacker.id}`)
		expect(recordTitle(def, attacker)).toBe('Attacker')
		expect(def.record?.image?.(attacker)).toContain(
			'grid_character_roles/8bbd9870-a997-4ece-adf2-e845b39da9f7.png?v='
		)
		expect(def.record?.image?.(healer)).toBe('')
	})
})
