/**
 * Form validation from a resource definition: each field's kind, `required`,
 * bounds and `validate`, plus the resource's cross-field `refine`.
 */
import { z } from 'zod'
import * as m from '$lib/paraglide/messages'
import { formFields, isShown } from './fields'
import type { EnumOption, Field, FormMode, ResourceDef, Values } from './types'

const required = { error: () => m.db_field_required() }

/**
 * Editor-facing wording for zod's built-in checks (bounds, whole numbers,
 * lengths). Rules with their own message keep it; anything else falls back
 * to zod's default. Pass as `safeParse(values, { error: issueMessage })`.
 */
export function issueMessage(issue: {
	code?: string
	origin?: string
	minimum?: unknown
	maximum?: unknown
	expected?: unknown
	format?: string
	input?: unknown
}): string | undefined {
	switch (issue.code) {
		case 'too_small':
			return issue.origin === 'number'
				? m.db_field_min({ min: String(issue.minimum) })
				: m.db_field_too_short({ min: String(issue.minimum) })
		case 'too_big':
			return issue.origin === 'number'
				? m.db_field_max({ max: String(issue.maximum) })
				: m.db_field_too_long({ max: String(issue.maximum) })
		case 'invalid_type':
			if (issue.input === null || issue.input === undefined) return m.db_field_required()
			if (issue.expected === 'int') return m.db_field_whole_number()
			return issue.expected === 'number' ? m.db_field_number() : undefined
		case 'invalid_format':
			return m.db_field_invalid_format()
		default:
			return undefined
	}
}

/** A blank required value says so, rather than naming the type it isn't */
const missing = {
	error: (issue: { input?: unknown }) =>
		issue.input === null || issue.input === undefined ? m.db_field_required() : undefined
}

const nonBlank = z.string().refine((v) => v.trim() !== '', required)

function oneOf(options: () => EnumOption[]) {
	return z.custom((v) => options().some((o) => o.value === v), {
		error: () => m.db_field_invalid_option()
	})
}

function kindSchema<Row, Full>(field: Field<Row, Full>): z.ZodType {
	switch (field.kind) {
		case 'text':
		case 'link':
		case 'code': {
			const text =
				field.kind === 'text' && field.maxLength !== undefined
					? z.string().max(field.maxLength)
					: z.string()
			return field.required ? text.pipe(nonBlank) : text
		}
		case 'localized': {
			const side = field.of === 'tags' ? z.array(z.string()) : z.string()
			return z.object({ en: field.required ? nonBlank : side, ja: side })
		}
		case 'number': {
			let number = z.number(missing)
			if (field.int) number = number.int()
			if (field.min !== undefined) number = number.min(field.min)
			if (field.max !== undefined) number = number.max(field.max)
			return field.required ? number : number.nullable()
		}
		case 'boolean':
			return z.boolean()
		case 'date':
		case 'datetime': {
			const iso = field.kind === 'date' ? z.iso.date() : z.iso.datetime({ offset: true })
			return field.required ? iso : z.union([z.literal(''), iso])
		}
		case 'enum':
			return field.required ? oneOf(field.options) : oneOf(field.options).nullable()
		case 'enumList': {
			const list = z.array(oneOf(field.options))
			return field.max !== undefined ? list.max(field.max) : list
		}
		case 'tags':
		case 'referenceList':
			return z.array(z.string())
		case 'reference':
			return field.required ? nonBlank : z.string().nullable()
		case 'custom':
			return z.unknown()
	}
}

/**
 * Validates form values for the mode. Fields hidden by `when` aren't
 * checked, so this is one schema whatever the values. Issues carry the
 * field key as their path.
 */
export function buildZod<Row, Full>(
	def: ResourceDef<Row, Full>,
	mode: FormMode
): z.ZodType<Values> {
	const checks = formFields(def, mode).map((field) => ({
		field,
		schemas: field.validate ? [kindSchema(field), field.validate] : [kindSchema(field)]
	}))

	return z.record(z.string(), z.unknown()).superRefine((values, ctx) => {
		for (const { field, schemas } of checks) {
			if (!isShown(field, values)) continue
			for (const schema of schemas) {
				const result = schema.safeParse(values[field.key], { error: issueMessage })
				if (result.success) continue
				for (const issue of result.error.issues) {
					ctx.addIssue({ code: 'custom', path: [field.key, ...issue.path], message: issue.message })
				}
				break
			}
		}
		def.refine?.(values, (key, message) => ctx.addIssue({ code: 'custom', path: [key], message }))
	})
}

/** Problems by field: a field key, or a path into one (`name.en`, `bullet_slots.0`) */
export type FieldErrors = Record<string, string>

/** The first message for each path */
export function issueErrors(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
	const errors: FieldErrors = {}
	for (const issue of issues) {
		const path = issue.path.map(String).join('.')
		errors[path] ??= issue.message
	}
	return errors
}

/** A field's error: its own, or the first one inside it */
export function fieldError(errors: FieldErrors, key: string): string | undefined {
	if (errors[key]) return errors[key]
	const inside = Object.keys(errors).find((path) => path.startsWith(`${key}.`))
	return inside ? errors[inside] : undefined
}

/**
 * A save's rejection, as field errors and messages for the rest. The API
 * answers a 422 with `errors` keyed by attribute (the param names); those
 * map back to their fields, a localized pair's to `key.en` / `key.ja`.
 * Anything else (`base`, other attributes, other failures) is `other`.
 */
export function serverErrors<Row, Full>(
	def: ResourceDef<Row, Full>,
	mode: FormMode,
	error: unknown
): { fields: FieldErrors; other: string[] } {
	const fields: FieldErrors = {}
	const other: string[] = []
	const failure = error as { status?: number; message?: string; details?: unknown } | null
	const byParam = (failure?.details as { errors?: unknown } | undefined)?.errors

	if (failure?.status !== 422 || typeof byParam !== 'object' || byParam === null) {
		other.push(failure?.message || m.db_edit_save_failed())
		return { fields, other }
	}

	const paths = new Map<string, string>()
	for (const field of formFields(def, mode)) {
		if (field.kind === 'localized') {
			paths.set(field.keys.en, `${field.key}.en`)
			paths.set(field.keys.ja, `${field.key}.ja`)
		} else {
			const write = field.write
			const param = typeof write === 'string' ? write : (write && write.key) || field.key
			paths.set(param, field.key)
		}
	}

	for (const [param, messages] of Object.entries(byParam)) {
		const message = [messages].flat().map(String).join(', ')
		const path = paths.get(param)
		if (path) fields[path] ??= message
		else other.push(param === 'base' ? message : `${param.replace(/_/g, ' ')} ${message}`)
	}
	return { fields, other }
}
