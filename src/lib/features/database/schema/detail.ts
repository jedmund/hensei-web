/**
 * The detail view's layout and plain-text values, from a definition and a
 * full record. The detail components draw what this returns.
 */
import * as m from '$lib/paraglide/messages'
import { localizedName } from '$lib/utils/locale'
import { getSeriesDisplayName } from '$lib/utils/weaponSeries'
import type { WeaponSeriesRef } from '$lib/types/api/weaponSeries'
import { fieldFor, readField } from './fields'
import { isEmpty, recordValues } from './form'
import type {
	DetailOptions,
	EnumOption,
	Field,
	ReferenceResource,
	ResourceDef,
	Section,
	Values
} from './types'

export interface DetailRow<Row = unknown, Full = unknown> {
	field: Field<Row, Full>
	/** What the row shows: `detail.value`, else what `read` returns */
	value: unknown
}

export interface DetailBlock<Row = unknown, Full = unknown> {
	section: Section
	rows: DetailRow<Row, Full>[]
}

export interface DetailLayout<Row = unknown, Full = unknown> {
	/** Every field's value, for `when` rules and link URLs */
	values: Values
	/** Sections with at least one row showing, in layout order */
	blocks: DetailBlock<Row, Full>[]
}

/** A field's detail options; none for a form-only field */
export function detailOptions<Row, Full>(field: Field<Row, Full>): DetailOptions<Full> {
	return field.detail || {}
}

/** Whether a field has a row in the detail for these values */
export function shownInDetail<Row, Full>(field: Field<Row, Full>, values: Values): boolean {
	if (field.detail === false) return false
	const { when = field.when, hideWhenEmpty } = detailOptions(field)
	if (when && !when(values)) return false
	return !(hideWhenEmpty && isEmpty(values[field.key]))
}

export function detailLayout<Row, Full>(
	def: ResourceDef<Row, Full>,
	record: Full
): DetailLayout<Row, Full> {
	const values = recordValues(def, record)
	const blocks = def.layout.detail.flatMap((section) => {
		const rows = section.fields
			.map((key) => fieldFor(def, key))
			.filter((field) => shownInDetail(field, values))
			.map((field) => {
				const display = detailOptions(field).value
				return { field, value: display ? display(record) : readField(field, record) }
			})
		return rows.length ? [{ section, rows }] : []
	})
	return { values, blocks }
}

/** What an empty value shows */
export function emptyText<Row, Full>(field: Field<Row, Full>): string {
	const empty = detailOptions(field).empty
	return typeof empty === 'function' ? empty() : (empty ?? '—')
}

function optionLabel(options: EnumOption[], value: unknown): string | undefined {
	const label = options.find((o) => o.value === value)?.label
	return typeof label === 'function' ? label() : label
}

/** References that draw as a link to the record */
const LINKED: ReferenceResource[] = ['character', 'weapon']

/** A reference's display name */
function referenceName<Row, Full>(field: Field<Row, Full>, ref: unknown): string | undefined {
	if (typeof ref === 'string') return ref || undefined
	if (field.kind === 'reference' && field.resource === 'weaponSeries') {
		return getSeriesDisplayName(ref as WeaponSeriesRef) || undefined
	}
	const name = (ref as { name?: { en?: string; ja?: string } } | null | undefined)?.name
	if (!name) return undefined
	const text = localizedName({ en: name.en ?? '', ja: name.ja ?? '' })
	return text === '—' ? undefined : text
}

/**
 * The row's text, or `null` when a component draws it (labels, links,
 * chips, custom pieces). Localized pairs draw a row per language, so they
 * never reach here.
 */
export function detailText<Row, Full>(field: Field<Row, Full>, value: unknown): string | null {
	const empty = emptyText(field)
	switch (field.kind) {
		case 'text':
		case 'date':
		case 'datetime':
			return (value as string | null | undefined) || empty
		case 'number':
			return value === null || value === undefined || value === '' ? empty : String(value)
		case 'boolean':
			return value ? m.data_table_yes() : m.data_table_no()
		case 'enum':
			// Elements and proficiencies show the label their column shows
			if (field.list?.type === 'element' || field.list?.type === 'proficiency') return null
			return optionLabel(field.options(), value) ?? empty
		case 'enumList': {
			const options = field.options()
			const labels = Array.isArray(value)
				? value.map((v) => optionLabel(options, v)).filter((l): l is string => Boolean(l))
				: []
			return labels.length ? labels.join(', ') : empty
		}
		case 'code':
		case 'link':
		case 'tags':
		case 'numberList':
			return isEmpty(value) ? empty : null
		case 'reference':
			if (isEmpty(value)) return empty
			// Characters and weapons draw as a link (characters with their tags)
			if (LINKED.includes(field.resource) && typeof value === 'object') return null
			return referenceName(field, value) ?? empty
		case 'referenceList': {
			const names = Array.isArray(value)
				? value.map((ref) => referenceName(field, ref)).filter((n): n is string => Boolean(n))
				: []
			return names.length ? names.join(', ') : empty
		}
		case 'custom':
			if (field.render?.detail) return null
			return isEmpty(value) ? empty : String(value)
		case 'localized':
			return null
	}
}

/** The record's name, from the list's title field (English first) */
export function recordTitle<Row, Full>(
	def: ResourceDef<Row, Full>,
	record: Full
): string | undefined {
	const value = readField(fieldFor(def, def.list.title), record)
	if (typeof value === 'string') return value || undefined
	const pair = value as { en?: string; ja?: string } | null | undefined
	return pair?.en || pair?.ja || undefined
}

/** The record's page: where saving its forms goes */
export function recordHref<Row, Full>(def: ResourceDef<Row, Full>, record: Full): string {
	const recordDef = def.record!
	return recordDef.path?.(record) ?? `/database/${def.name}/${recordDef.routeId(record)}`
}
