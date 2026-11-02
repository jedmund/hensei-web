/**
 * Parity: the artifact skills resource must keep what the hand-written pages
 * did (`__fixtures__/page-baseline.json`, captured before they were deleted,
 * and the edit page's payload, transcribed below), with the changes decided
 * for GBF-143 applied:
 * - one list with a Group column and filter, sorted by group then modifier,
 *   instead of three grouped tables;
 * - edit-only: no new page;
 * - the group is sent by name, blank game names and growth as null (so they
 *   can be cleared), and base values without gaps;
 * - the score category shows (read-only), and search runs on the server
 *   (names and game names, not the modifier or group).
 */
import { describe, expect, it } from 'vitest'
import { columnHeader } from '$lib/components/data-table/types'
import { columnsFor, filtersFor } from '$lib/features/database/schema/columns'
import { detailText, recordHref } from '$lib/features/database/schema/detail'
import { fieldFor } from '$lib/features/database/schema/fields'
import { formSections, fromRecord, toPayload } from '$lib/features/database/schema/form'
import { screenFor } from '$lib/features/database/schema/routes'
import { buildZod, issueErrors } from '$lib/features/database/schema/validation'
import type { Values } from '$lib/features/database/schema/types'
import type { AdminArtifactSkillRow } from '$lib/types/api/admin'
import type { ArtifactSkill } from '$lib/types/api/artifact'
import { artifactSkillsResource as def } from './resource'
import { formatBaseValues, trimBaseValues } from './baseValues'
import baseline from './__fixtures__/page-baseline.json'
import { records } from './__fixtures__/records'

const { atk, flurry, earrings } = records

const row: AdminArtifactSkillRow = {
	id: 'as-atk',
	skillGroup: 'group_i',
	modifier: 1,
	nameEn: 'ATK',
	nameJp: '攻撃力',
	gameNameEn: 'ATK',
	gameNameJp: null,
	polarity: 'positive',
	baseValues: [1320, 1440, 1560, 1680, 1800],
	suffixEn: '',
	suffixJp: ''
}

describe('artifact skills resource: list', () => {
	it("keeps the old tables' columns, with Group first and the rest hidden", () => {
		const columns = columnsFor(def)
		expect(columns.map((c) => [c.id, columnHeader(c), c.defaultHidden ?? false])).toEqual([
			['skill_group', 'Group', false],
			['modifier', 'Modifier', false],
			['name', 'Name', false],
			['game_name', 'Game Name', false],
			['polarity', 'Polarity', false],
			['base_values', 'Base Values', false],
			['growth', 'Growth', true],
			['suffix', 'Suffix', true],
			['score_category', 'Score Category', true],
			['updated_at', 'Last edited', true]
		])
		expect(baseline.list.columns).toEqual([
			'Mod',
			'Display Name',
			'Game Name',
			'Polarity',
			'Base Values'
		])
	})

	it('shows the group and polarity labels and the base values as the old table did', () => {
		const columns = columnsFor(def)
		const value = (id: string, r: AdminArtifactSkillRow) =>
			columns.find((c) => c.id === id)!.value!(r)
		expect(value('skill_group', row)).toBe(baseline.groupOptions[0])
		expect(value('polarity', row)).toBe('Positive')
		expect(value('base_values', row)).toBe('1320, 1440, 1560, 1680, 1800')
		expect(value('base_values', { ...row, baseValues: [null] })).toBe('?')
	})

	it('replaces the grouped tables with a group filter and a group, modifier sort', () => {
		expect(def.list.defaultSort).toEqual([
			{ id: 'skill_group', desc: false },
			{ id: 'modifier', desc: false }
		])
		expect(baseline.list.sortWithinGroup).toBe('modifier')
		expect(filtersFor(def).map((f) => (f.kind === 'toggles' ? f.id : f.key))).toEqual([
			'skill_group',
			'polarity',
			'score_category',
			'updated_at'
		])
		const group = filtersFor(def)[0]!
		expect(group.kind === 'multi' && group.options().map((o) => o.value)).toEqual([
			'group_i',
			'group_ii',
			'group_iii'
		])
	})

	it('links rows by id, at the same URLs as before', () => {
		expect(def.list.rowId!(row)).toBe('as-atk')
		expect(def.record!.routeId(atk)).toBe('as-atk')
		expect(recordHref(def, atk)).toBe(baseline.list.rowLink.replace('{id}', 'as-atk'))
	})
})

describe('artifact skills resource: edit-only', () => {
	it('has detail and edit screens but no new page', () => {
		expect(def.save?.create).toBeUndefined()
		expect(screenFor(def, 'new')).toBeUndefined()
		expect(screenFor(def, 'detail')).toBeDefined()
		expect(screenFor(def, 'edit')).toBeDefined()
	})

	it('has no "New" action in its section', () => {
		expect(def.section).toMatchObject({ parent: 'characters' })
		expect(def.section?.actions).toBeUndefined()
		expect(def.section?.entity).toBeUndefined()
	})
})

describe('artifact skills resource: edit form', () => {
	it("keeps the old page's sections and labels, in order", () => {
		const sections = formSections(def, 'edit').map(({ section, fields }) => ({
			title: section.title(),
			labels: fields.flatMap((f) => {
				if (f.kind === 'localized') return [f.labels.en(), f.labels.ja()]
				if (f.key === 'base_values') return [1, 2, 3, 4, 5].map((q) => `Quality ${q}`)
				return [f.label()]
			})
		}))
		// Decided: group and modifier are fixed (saved artifacts store skills by
		// that pair), so they leave the form; the dash is an en dash
		const fixed = new Set(['Skill Group', 'Modifier'])
		const expected = baseline.edit
			.map((s) => ({
				title: s.title.replace('1-5', '1–5'),
				labels: s.labels.filter((l) => !fixed.has(l))
			}))
			.filter((s) => s.labels.length > 0)
		expect(sections).toEqual(expected)
	})

	it('offers the old group and polarity options', () => {
		const labels = (key: string) => {
			const field = fieldFor(def, key)
			if (field.kind !== 'enum') throw new Error(key)
			return field.options().map((o) => (typeof o.label === 'function' ? o.label() : o.label))
		}
		expect(labels('skill_group')).toEqual(baseline.groupOptions)
		expect(labels('polarity')).toEqual(baseline.polarityOptions)
	})
})

/** The old edit page's `saveChanges` payload for the record */
function legacyEdit(skill: ArtifactSkill) {
	const groups: Record<string, number> = { group_i: 1, group_ii: 2, group_iii: 3 }
	return {
		name_en: skill.name?.en || '',
		name_jp: skill.name?.ja || '',
		game_name_en: skill.gameName?.en || undefined,
		game_name_jp: skill.gameName?.ja || undefined,
		skill_group: groups[skill.skillGroup] ?? 1,
		modifier: skill.modifier || 0,
		polarity: skill.polarity || 'positive',
		base_values: skill.baseValues || [],
		growth: skill.growth ?? undefined,
		suffix_en: skill.suffix?.en || '',
		suffix_jp: skill.suffix?.ja || ''
	}
}

/**
 * The decided changes: group and modifier are never sent (they're fixed), and
 * blanks are sent as null so they clear
 */
function decided(skill: ArtifactSkill) {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- dropped on purpose
	const { skill_group, modifier, ...legacy } = legacyEdit(skill)
	return {
		...legacy,
		game_name_en: legacy.game_name_en ?? null,
		game_name_jp: legacy.game_name_jp ?? null,
		growth: legacy.growth ?? null
	}
}

const editPayload = (skill: ArtifactSkill) => toPayload(def, fromRecord(def, skill), 'edit')

describe('artifact skills resource: edit payload parity', () => {
	it('matches the edit page, with the decided changes', () => {
		for (const skill of [atk, flurry, earrings]) {
			expect(editPayload(skill)).toEqual(decided(skill))
		}
	})

	it('never sends the score category', () => {
		expect(editPayload(atk)).not.toHaveProperty('score_category')
	})

	it('trims blank qualities off the end and keeps an empty list', () => {
		const values = { ...fromRecord(def, atk), base_values: [1, 2, null, null, null] }
		expect(toPayload(def, values, 'edit').base_values).toEqual([1, 2])
		const empty = { ...fromRecord(def, atk), base_values: [null] }
		expect(toPayload(def, empty, 'edit').base_values).toEqual([])
		expect(trimBaseValues(undefined)).toEqual([])
	})
})

describe('artifact skills resource: validation', () => {
	const errors = (values: Values) => {
		const result = buildZod(def, 'edit').safeParse(values)
		return result.success ? {} : issueErrors(result.error.issues)
	}
	const base = fromRecord(def, atk)

	it('accepts every fixture record as loaded', () => {
		for (const skill of [atk, flurry, earrings]) expect(errors(fromRecord(def, skill))).toEqual({})
	})

	it('needs both names and a polarity', () => {
		expect(Object.keys(errors({ ...base, name: { en: '', ja: '攻撃力' } }))).toEqual(['name.en'])
		expect(Object.keys(errors({ ...base, name: { en: 'ATK', ja: ' ' } }))).toEqual(['name.ja'])
		expect(Object.keys(errors({ ...base, polarity: null }))).toEqual(['polarity'])
	})

	it('never sends the group or modifier, which are fixed', () => {
		const payload = editPayload(atk)
		expect(payload).not.toHaveProperty('skill_group')
		expect(payload).not.toHaveProperty('modifier')
	})

	it('reports a blank quality before a filled one, and more than five values', () => {
		expect(errors({ ...base, base_values: [1, null, 3] })).toEqual({
			'base_values.1': 'Fill in every quality before the last one'
		})
		expect(errors({ ...base, base_values: [1, null, null] })).toEqual({})
		expect(Object.keys(errors({ ...base, base_values: [1, 2, 3, 4, 5, 6] }))).toEqual([
			'base_values'
		])
	})
})

describe('artifact skills resource: detail', () => {
	it('shows base values as a list, unknowns as "?", none as a dash', () => {
		const field = fieldFor(def, 'base_values')
		expect(formatBaseValues(atk.baseValues)).toBe('1320, 1440, 1560, 1680, 1800')
		expect(detailText(field, formatBaseValues(flurry.baseValues))).toBe('200')
		expect(detailText(field, formatBaseValues(earrings.baseValues))).toBe('—')
		expect(formatBaseValues([0.2, null])).toBe('0.2, ?')
	})
})
