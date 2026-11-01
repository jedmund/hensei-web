/**
 * Parity: the raids resource must reproduce what the hand-written raids
 * pages did: the old grid's columns and filters (where the new list keeps
 * them), and the edit and new pages' payloads (transcribed below), with the
 * changes decided for GBF-143 applied on top.
 */
import { describe, expect, it } from 'vitest'
import { labelText } from '$lib/components/data-table/filters'
import { columnHeader } from '$lib/components/data-table/types'
import { columnsFor, filterQueries, filtersFor } from '$lib/features/database/schema/columns'
import { recordHref } from '$lib/features/database/schema/detail'
import { fromRecord, initialValues, toPayload } from '$lib/features/database/schema/form'
import { buildZod, issueErrors, issueMessage } from '$lib/features/database/schema/validation'
import type { AdminRaidRow } from '$lib/types/api/admin'
import type { RaidFull } from '$lib/types/api/raid'
import { raidsResource as def } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'

const { full, sparse } = detailRecords

/** What goes over the wire: JSON drops undefined */
const wire = (payload: object) => JSON.parse(JSON.stringify(payload)) as Record<string, unknown>

describe('raids resource: list', () => {
	const columns = columnsFor(def)
	const column = (id: string) => columns.find((c) => c.id === id)!

	it("keeps the old grid's columns, with the rest available", () => {
		expect(columns.map((c) => [c.id, columnHeader(c), c.defaultHidden ?? false])).toEqual([
			['image', '', false],
			['name', 'Name', false],
			['level', 'Level', false],
			['element', 'Element', false],
			['group', 'Group', false],
			['player_count', 'Players', true],
			['slug', 'Slug', true],
			['released_at', 'Release date', true],
			['extra', 'Extra', true],
			['updated_at', 'Last edited', true]
		])
	})

	it("reads the group's name and the player count's label from a row", () => {
		const row = {
			slug: 'wilnas',
			playerCount: 1,
			group: { id: 'g', nameEn: 'Six-Dragons', nameJp: '六竜', section: 1, order: 7 }
		} as AdminRaidRow
		expect(column('group').value?.(row)).toBe('Six-Dragons')
		expect(column('group').sortField).toBe('group_order')
		expect(column('player_count').value?.(row)).toBe('Solo')
		expect(column('element').type).toBe('element')
	})

	it('filters on element (Null included), group, players, HL and Extra, and edits', () => {
		const filters = filtersFor(def, { group: () => [] })
		expect(
			filters.map((f) =>
				f.kind === 'toggles'
					? [f.id, f.toggles.map((t) => `${t.key}:${labelText(t.label)}`)]
					: [f.key, f.kind]
			)
		).toEqual([
			['element', 'multi'],
			['group', 'multi'],
			['player_count', 'multi'],
			['flags', ['hl:HL', 'extra:Extra']],
			['updated_at', 'recent']
		])
		const element = filters.find((f) => f.kind === 'multi' && f.key === 'element')
		if (element?.kind !== 'multi') throw new Error('no element filter')
		// 38 raids have no element
		expect(element.options().map((o) => o.value)).toContain('0')
		expect(filterQueries(def).map(([key, query]) => [key, query().queryKey])).toEqual([
			['group', ['raids', 'groups']]
		])
	})

	it('lists the groups in the raid list order', () => {
		const filters = filtersFor(def, {
			group: () => [
				{ id: 'b', name: { en: 'Event raid', ja: '' }, section: 2, order: 1 },
				{ id: 'c', name: { en: 'Six-Dragons', ja: '' }, section: 1, order: 7 },
				{ id: 'a', name: { en: 'Omega', ja: '' }, section: 1, order: 1 }
			]
		})
		const group = filters.find((f) => f.kind === 'multi' && f.key === 'group')
		if (group?.kind !== 'multi') throw new Error('no group filter')
		expect(group.options().map((o) => o.value)).toEqual(['a', 'c', 'b'])
	})

	it('keys rows by slug, colours them by element, and keeps the API order', () => {
		expect(def.list.rowId!({ slug: 'wilnas' } as AdminRaidRow)).toBe('wilnas')
		expect(def.list.baseFields).toContain('slug')
		expect(def.list.element).toBe('element')
		// group section, group order, element, level: the old grid's order
		expect(def.list.defaultSort).toEqual([])
	})

	it('sends the old Groups tab to the raid groups list', () => {
		expect(def.list.movedViews).toEqual({ groups: '/database/raid-groups' })
	})
})

// --- Edit and new: the old pages, transcribed ---

/** The edit page's form state from the record (its `$effect`) */
function legacyEditData(raid: RaidFull) {
	return {
		name_en: raid.name.en || '',
		name_jp: raid.name.ja || '',
		slug: raid.slug || '',
		level: raid.level as number | undefined,
		element: raid.element ?? 0,
		player_count: raid.playerCount ?? 18,
		group_id: raid.group?.id || '',
		enemy_id: raid.enemyId,
		summon_id: raid.summonId,
		quest_id: raid.questId,
		released_at: raid.releasedAt ?? '',
		extra: raid.extra ?? false
	}
}

const orUndefined = (value: number | null | undefined) =>
	value === null || value === undefined ? undefined : value

/** The edit and new pages' payload */
function legacyPayload(e: ReturnType<typeof legacyEditData>) {
	return {
		name_en: e.name_en,
		name_jp: e.name_jp,
		slug: e.slug,
		level: orUndefined(e.level),
		element: e.element,
		player_count: e.player_count,
		group_id: e.group_id,
		enemy_id: orUndefined(e.enemy_id),
		summon_id: orUndefined(e.summon_id),
		quest_id: orUndefined(e.quest_id),
		released_at: e.released_at || null,
		extra: e.extra
	}
}

/**
 * GBF-143: blanks send null, so they can be cleared. The old pages left out
 * a blank level and game ids, and sent a blank Japanese name as ''.
 */
function decided(legacy: Record<string, unknown>) {
	const out = { ...legacy }
	for (const key of ['level', 'enemy_id', 'summon_id', 'quest_id']) out[key] ??= null
	if (out.name_jp === '') out.name_jp = null
	return out
}

describe('raids resource: edit payload', () => {
	it.each(['full', 'sparse'] as const)('matches the old edit page (%s)', (name) => {
		const raid = detailRecords[name]
		const legacy = wire(legacyPayload(legacyEditData(raid)))
		expect(wire(toPayload(def, fromRecord(def, raid), 'edit'))).toEqual(decided(legacy))
	})

	it('writes the group as group_id, and never the read-only group values', () => {
		const payload = toPayload(def, fromRecord(def, full), 'edit')
		expect(payload.group_id).toBe('g-six-dragons')
		for (const key of ['group', 'difficulty', 'hl', 'guidebooks', 'updated_at']) {
			expect(payload).not.toHaveProperty(key)
		}
	})

	it('saves to the new slug when the slug changes', () => {
		expect(recordHref(def, { ...full, slug: 'wilnas-impossible' })).toBe(
			'/database/raids/wilnas-impossible'
		)
	})
})

describe('raids resource: new payload', () => {
	it("starts from the old page's defaults", () => {
		const values = initialValues(def)
		expect(values).toMatchObject({ element: 0, player_count: 18, extra: false })
	})

	it('matches the old new page once filled in', () => {
		const values = {
			...initialValues(def),
			name: { en: 'Wilnas', ja: '' },
			slug: 'wilnas',
			group: 'g-six-dragons'
		}
		const legacy = legacyPayload({
			name_en: 'Wilnas',
			name_jp: '',
			slug: 'wilnas',
			level: undefined,
			element: 0,
			player_count: 18,
			group_id: 'g-six-dragons',
			enemy_id: undefined,
			summon_id: undefined,
			quest_id: undefined,
			released_at: '',
			extra: false
		})
		expect(wire(toPayload(def, values, 'create'))).toEqual(decided(wire(legacy)))
	})
})

describe('raids resource: validation', () => {
	const errors = (values: Record<string, unknown>) => {
		const result = buildZod(def, 'create').safeParse(
			{ ...initialValues(def), ...values },
			{ error: issueMessage }
		)
		return result.success ? {} : issueErrors(result.error.issues)
	}

	it('needs an English name, a slug and a group, as the old pages did', () => {
		expect(Object.keys(errors({}))).toEqual(expect.arrayContaining(['name.en', 'slug', 'group']))
	})

	it("checks the slug's format and the game ids", () => {
		const valid = { name: { en: 'Wilnas', ja: '' }, group: 'g' }
		expect(errors({ ...valid, slug: 'wilnas-hard' })).toEqual({})
		expect(errors({ ...valid, slug: 'Wilnas Hard' }).slug).toBe(
			'Use lowercase letters and numbers, joined by dashes'
		)
		expect(errors({ ...valid, slug: 'wilnas', enemy_id: 0 }).enemy_id).toBe('Must be at least 1')
		expect(errors({ ...valid, slug: 'wilnas', level: 1.5 }).level).toBe('Must be a whole number')
	})

	it('takes only the four player counts', () => {
		const valid = { name: { en: 'Wilnas', ja: '' }, group: 'g', slug: 'wilnas' }
		expect(errors({ ...valid, player_count: 30 })).toEqual({})
		expect(errors({ ...valid, player_count: 4 }).player_count).toBe('Choose one of the options')
	})

	it('keeps the sparse raid valid', () => {
		const result = buildZod(def, 'edit').safeParse(fromRecord(def, sparse))
		expect(result.success).toBe(true)
	})
})
