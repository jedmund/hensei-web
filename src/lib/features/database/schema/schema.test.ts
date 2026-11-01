import { describe, expect, it } from 'vitest'
import { columnsFor, filtersFor } from './columns'
import { camelKey } from './fields'
import { applyDerive, fromRecord, initialValues, isEmpty, toPayload } from './form'
import { defineResource, type Values } from './types'
import { buildZod } from './validation'

interface Row {
	id: string
	code: string
	level: number | null
	kindOf: number | null
	titleEn: string | null
	titleJp: string | null
}

interface Full {
	code: string
	title: { en?: string; ja?: string }
	level?: number | null
	kindOf?: number | null
	owner?: { id: string; slug: string } | null
	tagIds?: { id: string }[]
	note?: string
	startsOn?: string | null
	active?: boolean
	secret?: string
	computed?: string
}

const label = () => 'Label'

const def = defineResource<Row, Full>({
	name: 'things',
	fields: [
		{ key: 'code', kind: 'code', label, required: true },
		{
			key: 'title',
			kind: 'localized',
			label,
			keys: { en: 'title_en', ja: 'title_jp' },
			labels: { en: label, ja: label }
		},
		{ key: 'level', kind: 'number', label, int: true, min: 1, max: 10 },
		{
			key: 'kind_of',
			kind: 'enum',
			label,
			options: () => [
				{ value: 1, label: 'One' },
				{ value: 2, label: () => 'Two' }
			],
			filter: { kind: 'multi', facet: true }
		},
		{
			key: 'owner',
			kind: 'reference',
			label,
			resource: 'character',
			write: 'owner_id',
			id: (ref) => (ref as Full['owner'])?.slug ?? null
		},
		{ key: 'tag_ids', kind: 'referenceList', label, resource: 'awakening', read: (r) => r.tagIds },
		{ key: 'note', kind: 'text', label, when: (v) => v.active === true },
		{ key: 'starts_on', kind: 'date', label },
		{ key: 'active', kind: 'boolean', label, filter: { kind: 'toggle', label: () => 'On' } },
		{ key: 'secret', kind: 'text', label, form: false },
		{ key: 'computed', kind: 'text', label, write: false },
		{ key: 'draft', kind: 'text', label, form: { edit: false }, default: 'new' }
	],
	list: {
		columns: ['code', 'title', 'level', 'kind_of', 'starts_on'],
		filters: ['kind_of', { id: 'flags', label, toggles: ['active', { key: 'stale', label }] }],
		baseFields: ['code'],
		defaultSort: []
	},
	layout: { detail: [] },
	derive: [(v, changed) => (changed === 'kind_of' ? { level: null } : undefined)],
	refine: (v, issue) => {
		if (v.active === true && v.starts_on === '') issue('starts_on', 'Needed when active')
	}
})

const record: Full = {
	code: 'abc',
	title: { en: 'Title' },
	level: 3,
	kindOf: 2,
	owner: { id: 'uuid', slug: 'owner-slug' },
	tagIds: [{ id: 't1' }, { id: 't2' }],
	note: 'hello',
	startsOn: null,
	active: true,
	secret: 'hidden',
	computed: 'server'
}

describe('camelKey', () => {
	it('camelCases snake keys', () => {
		expect(camelKey('max_hp_flb')).toBe('maxHpFlb')
		expect(camelKey('name')).toBe('name')
	})
})

describe('columnsFor', () => {
	const columns = columnsFor(def)
	const row: Row = { id: '1', code: 'abc', level: 4, kindOf: 2, titleEn: 'T', titleJp: 'ティー' }

	it('maps kinds to cells', () => {
		expect(columns.map((c) => [c.id, c.type])).toEqual([
			['code', 'code'],
			['title', 'name'],
			['level', 'number'],
			['kind_of', 'text'],
			['starts_on', 'date']
		])
	})

	it('reads camelCased row fields and requests the snake keys', () => {
		const [code, title, level, kind] = columns
		expect(code?.value?.(row)).toBe('abc')
		expect(level).toMatchObject({ align: 'end', fields: ['level'] })
		expect(title).toMatchObject({ sortField: 'title_en', fields: ['title_en', 'title_jp'] })
		if (title?.type === 'name') expect(title.name(row)).toEqual({ en: 'T', ja: 'ティー' })
		expect(kind?.value?.(row)).toBe('Two')
		expect(kind?.sortValue?.(row)).toBe(2)
	})
})

describe('filtersFor', () => {
	it('derives enum options and toggle labels', () => {
		const [kind, flags] = filtersFor(def)
		if (kind?.kind !== 'multi' || flags?.kind !== 'toggles') throw new Error('wrong kinds')
		expect(kind.options()).toEqual([
			{ value: '1', label: 'One' },
			{ value: '2', label: expect.any(Function) }
		])
		expect(kind.facet).toBe(true)
		expect(
			flags.toggles.map((t) => [t.key, typeof t.label === 'function' ? t.label() : t.label])
		).toEqual([
			['active', 'On'],
			['stale', 'Label']
		])
	})

	it('rejects fields without a list filter', () => {
		expect(() => filtersFor({ ...def, list: { ...def.list, filters: ['code'] } })).toThrow()
	})
})

describe('fromRecord and toPayload', () => {
	it('reads values and leaves read-only and form-less fields out', () => {
		const values = fromRecord(def, record)
		expect(values).toEqual({
			code: 'abc',
			title: { en: 'Title', ja: '' },
			level: 3,
			kind_of: 2,
			owner: 'owner-slug',
			tag_ids: ['t1', 't2'],
			note: 'hello',
			starts_on: '',
			active: true
		})
	})

	it('writes renames, splits localized pairs and nulls empty dates', () => {
		expect(toPayload(def, fromRecord(def, record), 'edit')).toEqual({
			code: 'abc',
			title_en: 'Title',
			title_jp: '',
			level: 3,
			kind_of: 2,
			owner_id: 'owner-slug',
			tag_ids: ['t1', 't2'],
			note: 'hello',
			starts_on: null,
			active: true
		})
	})

	it('drops hidden fields', () => {
		const values = { ...fromRecord(def, record), active: false }
		expect(toPayload(def, values, 'edit')).not.toHaveProperty('note')
	})

	it('sends create-only fields on create', () => {
		const values = initialValues(def)
		expect(values).toMatchObject({ draft: 'new', active: false, tag_ids: [], owner: null })
		expect(toPayload(def, values, 'create')).toMatchObject({ draft: 'new', owner_id: null })
		expect(toPayload(def, fromRecord(def, record), 'edit')).not.toHaveProperty('draft')
	})

	it('honours empty policies', () => {
		const omit = defineResource<Row, Full>({
			...def,
			fields: [
				{ key: 'a', kind: 'text', label, empty: 'omit' },
				{ key: 'b', kind: 'text', label, empty: 'null' },
				{ key: 'c', kind: 'text', label },
				{ key: 'd', kind: 'custom', label },
				{ key: 'e', kind: 'number', label, write: { value: (v) => v || null } }
			]
		})
		expect(toPayload(omit, { a: '', b: '', c: '', d: {}, e: 0 }, 'edit')).toEqual({
			b: null,
			c: '',
			d: null,
			e: null
		})
	})

	it('treats blanks, empty lists and empty objects as empty', () => {
		expect([null, undefined, '', [], {}].every(isEmpty)).toBe(true)
		expect([0, false, 'x', [1], { a: 1 }].some(isEmpty)).toBe(false)
	})
})

describe('derive', () => {
	it('passes the changed key and applies patches in order', () => {
		const values = fromRecord(def, record)
		expect(applyDerive(def, { ...values, kind_of: 1 }, 'kind_of').level).toBeNull()
		expect(applyDerive(def, values, null).level).toBe(3)
	})
})

describe('buildZod', () => {
	const errors = (values: Values) => {
		const result = buildZod(def, 'edit').safeParse(values)
		return result.success ? [] : result.error.issues.map((i) => [i.path.join('.'), i.message])
	}
	const valid = () => fromRecord(def, record)

	it('passes valid values', () => {
		expect(errors({ ...valid(), starts_on: '2026-01-01' })).toEqual([])
	})

	it('checks required, int, bounds and enum membership', () => {
		expect(errors({ ...valid(), starts_on: '2026-01-01', code: '' }).map(([p]) => p)).toEqual([
			'code'
		])
		const paths = (v: Values) =>
			errors({ ...valid(), starts_on: '2026-01-01', ...v }).map(([p]) => p)
		expect(paths({ level: 2.5 })).toEqual(['level'])
		expect(paths({ level: 11 })).toEqual(['level'])
		expect(paths({ level: null })).toEqual([])
		expect(paths({ kind_of: 3 })).toEqual(['kind_of'])
	})

	it('runs refine and skips hidden fields', () => {
		expect(errors(valid())).toEqual([['starts_on', 'Needed when active']])
		expect(errors({ ...valid(), active: false, note: 42 })).toEqual([])
		expect(errors({ ...valid(), starts_on: '2026-01-01', note: 42 }).map(([p]) => p)).toEqual([
			'note'
		])
	})
})
