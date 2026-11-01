/**
 * Parity: the raid groups resource must reproduce what the raids list's old
 * Groups tab and the hand-written group pages did: the tab's columns, and the
 * edit and new pages' payloads (transcribed below).
 */
import { describe, expect, it } from 'vitest'
import { columnHeader } from '$lib/components/data-table/types'
import { columnsFor, filtersFor } from '$lib/features/database/schema/columns'
import { fromRecord, initialValues, toPayload } from '$lib/features/database/schema/form'
import { buildZod, issueErrors, issueMessage } from '$lib/features/database/schema/validation'
import type { AdminRaidGroupRow } from '$lib/types/api/admin'
import type { RaidGroupFull } from '$lib/types/api/raid'
import { raidGroupsResource as def } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'

describe('raid groups resource: list', () => {
	const columns = columnsFor(def)
	const column = (id: string) => columns.find((c) => c.id === id)!

	it("keeps the old Groups tab's columns, with order and each flag available", () => {
		expect(columns.map((c) => [c.id, columnHeader(c), c.defaultHidden ?? false])).toEqual([
			['name', 'Name', false],
			['section', 'Section', false],
			['order', 'Order', false],
			['player_counts', 'Players', false],
			['difficulty', 'Difficulty', false],
			['flags', 'Flags', false],
			['raid_count', 'Raids', false],
			['hl', 'HL', true],
			['extra', 'Extra', true],
			['guidebooks', 'Guidebooks', true],
			['unlimited', 'Unlimited', true],
			['support_summon', 'Support summon', true],
			['updated_at', 'Last edited', true]
		])
	})

	it("reads the section's label, the player counts and the flags from a row", () => {
		const row = {
			id: 'g',
			section: 0,
			playerCounts: [1, 6],
			hl: true,
			extra: false,
			guidebooks: true,
			unlimited: false,
			supportSummon: false
		} as AdminRaidGroupRow
		expect(column('section').value?.(row)).toBe('Farming')
		expect(column('player_counts').value?.(row)).toBe('1, 6')
		expect(column('player_counts').value?.({ ...row, playerCounts: [] })).toBeNull()
		const flags = column('flags')
		if (flags.type !== 'flags') throw new Error('no flags column')
		expect(flags.flags(row).map((f) => f.label)).toEqual(['HL', 'Guidebooks', 'No support summon'])
	})

	it('filters on section and the flags', () => {
		expect(
			filtersFor(def).map((f) =>
				f.kind === 'toggles' ? [f.id, f.toggles.map((t) => t.key)] : [f.key, f.kind]
			)
		).toEqual([
			['section', 'multi'],
			['flags', ['hl', 'extra', 'guidebooks', 'unlimited', 'support_summon']]
		])
	})

	it('keys rows by id and sorts them as the raid list does', () => {
		expect(def.list.rowId!({ id: 'g-1' } as AdminRaidGroupRow)).toBe('g-1')
		expect(def.list.defaultSort).toEqual([
			{ id: 'section', desc: false },
			{ id: 'order', desc: false }
		])
	})
})

// --- Edit and new: the old pages, transcribed ---

function legacyEditData(group: RaidGroupFull) {
	return {
		name_en: group.name.en || '',
		name_jp: group.name.ja || '',
		section: typeof group.section === 'string' ? parseInt(group.section) : group.section,
		order: group.order ?? 0,
		difficulty: group.difficulty ?? 1,
		hl: group.hl ?? false,
		extra: group.extra ?? false,
		guidebooks: group.guidebooks ?? false,
		unlimited: group.unlimited ?? false,
		supportSummon: group.supportSummon ?? true
	}
}

function legacyPayload(e: ReturnType<typeof legacyEditData>) {
	return {
		name_en: e.name_en,
		name_jp: e.name_jp,
		section: e.section,
		order: e.order,
		difficulty: e.difficulty,
		hl: e.hl,
		extra: e.extra,
		guidebooks: e.guidebooks,
		unlimited: e.unlimited,
		support_summon: e.supportSummon
	}
}

describe('raid groups resource: edit payload', () => {
	// A blank difficulty loads as 1, as the old page had it (none are blank in production)
	it.each(['full', 'empty'] as const)('matches the old edit page (%s)', (name) => {
		const group = detailRecords[name]
		expect(toPayload(def, fromRecord(def, group), 'edit')).toEqual(
			legacyPayload(legacyEditData(group))
		)
	})

	it('never writes its raids or counts', () => {
		const payload = toPayload(def, fromRecord(def, detailRecords.full), 'edit')
		for (const key of ['raids', 'raid_count', 'player_counts']) {
			expect(payload).not.toHaveProperty(key)
		}
	})
})

describe('raid groups resource: new payload', () => {
	it("matches the old new page's defaults once named", () => {
		const values = { ...initialValues(def), name: { en: 'Omega', ja: 'マグナ' } }
		expect(toPayload(def, values, 'create')).toEqual({
			name_en: 'Omega',
			name_jp: 'マグナ',
			section: 1,
			order: 0,
			difficulty: 1,
			hl: false,
			extra: false,
			guidebooks: false,
			unlimited: false,
			support_summon: true
		})
	})

	it('needs both names, as the old pages did', () => {
		const result = buildZod(def, 'create').safeParse(initialValues(def), { error: issueMessage })
		expect(result.success).toBe(false)
		if (result.success) return
		expect(issueErrors(result.error.issues)).toMatchObject({
			'name.en': 'Required',
			'name.ja': 'Required'
		})
	})

	it('offers the Farming section (0)', () => {
		const result = buildZod(def, 'edit').safeParse(fromRecord(def, detailRecords.empty))
		expect(result.success).toBe(true)
	})
})
