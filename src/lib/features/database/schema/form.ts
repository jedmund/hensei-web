/**
 * Form values from a full record, derived values, and the API payload.
 */
import { fieldFor, formFields, isShown, offForm, onForm, readField } from './fields'
import type {
	EmptyPolicy,
	Field,
	FieldKind,
	FormMode,
	ResourceDef,
	Section,
	Values,
	WriteOptions
} from './types'

/** What an unset field holds in the form */
function emptyValue(kind: FieldKind): unknown {
	switch (kind) {
		case 'text':
		case 'link':
		case 'code':
		case 'date':
		case 'datetime':
			return ''
		case 'boolean':
			return false
		case 'enumList':
		case 'tags':
		case 'referenceList':
			return []
		default:
			return null
	}
}

function initial<Row, Full>(field: Field<Row, Full>): unknown {
	if (field.default !== undefined) return structuredClone(field.default)
	if (field.kind === 'localized') {
		const empty = field.of === 'tags' ? [] : ''
		return { en: structuredClone(empty), ja: structuredClone(empty) }
	}
	return emptyValue(field.kind)
}

function refId<Row, Full>(field: Field<Row, Full>, ref: unknown): string | null {
	if (field.kind === 'reference' || field.kind === 'referenceList') {
		if (field.id) return field.id(ref)
	}
	if (typeof ref === 'string') return ref
	return ((ref as { id?: string } | null | undefined)?.id ?? null) || null
}

/** The form value for one field, from what its `read` returns */
function formValue<Row, Full>(field: Field<Row, Full>, raw: unknown): unknown {
	switch (field.kind) {
		case 'localized': {
			const pair = raw as { en?: unknown; ja?: unknown } | null | undefined
			const empty = initial(field) as { en: unknown; ja: unknown }
			return { en: pair?.en ?? empty.en, ja: pair?.ja ?? empty.ja }
		}
		case 'reference':
			return refId(field, raw)
		case 'referenceList':
			return Array.isArray(raw)
				? raw.map((ref) => refId(field, ref)).filter((id) => id !== null)
				: []
		default:
			return raw ?? initial(field)
	}
}

/** Runs the derive rules; `changed` is the key just edited, or null on load */
export function applyDerive<Row, Full>(
	def: ResourceDef<Row, Full>,
	values: Values,
	changed: string | null
): Values {
	let next = values
	for (const rule of def.derive ?? []) {
		const patch = rule(next, changed)
		if (patch) next = { ...next, ...patch }
	}
	return next
}

function readValues<Row, Full>(fields: Field<Row, Full>[], record: Full): Values {
	const values: Values = {}
	for (const field of fields) values[field.key] = formValue(field, readField(field, record))
	return values
}

/** Every field's value from the full record, as the forms hold it: what `when` rules read */
export function recordValues<Row, Full>(def: ResourceDef<Row, Full>, record: Full): Values {
	return readValues(def.fields, record)
}

/** Edit form values from the full record, with derived values applied */
export function fromRecord<Row, Full>(def: ResourceDef<Row, Full>, record: Full): Values {
	return applyDerive(def, readValues(formFields(def, 'edit'), record), null)
}

/** Create form values: defaults, with derived values applied */
export function initialValues<Row, Full>(def: ResourceDef<Row, Full>): Values {
	const values: Values = {}
	for (const field of formFields(def, 'create')) values[field.key] = initial(field)
	return applyDerive(def, values, null)
}

export function isEmpty(value: unknown): boolean {
	if (value === null || value === undefined || value === '') return true
	if (Array.isArray(value)) return value.length === 0
	if (typeof value === 'object') return Object.keys(value).length === 0
	return false
}

/** Lists and booleans send their empty value; anything else blank is null */
const KEEP_WHEN_EMPTY: FieldKind[] = ['boolean', 'enumList', 'tags', 'referenceList']

function emptyPolicy<Row, Full>(field: Field<Row, Full>): EmptyPolicy {
	if (field.empty) return field.empty
	if (field.kind === 'localized') return field.of === 'tags' ? 'keep' : 'null'
	return KEEP_WHEN_EMPTY.includes(field.kind) ? 'keep' : 'null'
}

/** A form's sections, each with the fields it draws: form fields, and read-only previews */
export interface FormSection<Row = unknown, Full = unknown> {
	section: Section
	fields: Field<Row, Full>[]
}

/**
 * The form's layout for the mode (`create` falls back to `edit`, `edit` to
 * `detail`). Whether each field shows still depends on the values (`when`).
 */
export function formSections<Row, Full>(
	def: ResourceDef<Row, Full>,
	mode: FormMode
): FormSection<Row, Full>[] {
	const { detail, edit = detail, create = edit } = def.layout
	return (mode === 'edit' ? edit : create).flatMap((section) => {
		const fields = section.fields
			.map((key) => fieldFor(def, key))
			.filter((field) => onForm(field, mode) || (field.render?.input && !offForm(field, mode)))
		return fields.length ? [{ section, fields }] : []
	})
}

/**
 * The API payload: shown, writable fields of the mode, under their param
 * names, with empty values handled by each field's `empty` policy. A field
 * `when` hides is left out, or sent empty if its `whenHidden` says so.
 */
export function toPayload<Row, Full>(
	def: ResourceDef<Row, Full>,
	values: Values,
	mode: FormMode
): Values {
	const payload: Values = {}
	for (const field of formFields(def, mode)) {
		if (field.write === false) continue
		const shown = isShown(field, values)
		if (!shown && field.whenHidden !== 'empty') continue

		const write: WriteOptions =
			typeof field.write === 'string'
				? { key: field.write }
				: typeof field.write === 'object'
					? field.write
					: {}
		const raw = shown ? values[field.key] : emptyValue(field.kind)
		const value = write.value ? write.value(raw, values) : raw
		const policy = emptyPolicy(field)
		const set = (key: string, v: unknown) => {
			if (!isEmpty(v)) payload[key] = v
			else if (policy === 'null') payload[key] = null
			else if (policy === 'keep') payload[key] = v
		}

		if (field.kind === 'localized') {
			const pair = (value ?? {}) as { en?: unknown; ja?: unknown }
			set(field.keys.en, pair.en)
			set(field.keys.ja, pair.ja)
		} else {
			set(write.key ?? field.key, value)
		}
	}
	return payload
}
