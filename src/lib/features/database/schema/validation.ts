/**
 * Form validation from a resource definition: each field's kind, `required`,
 * bounds and `validate`, plus the resource's cross-field `refine`.
 */
import { z } from 'zod'
import * as m from '$lib/paraglide/messages'
import { formFields, isShown } from './fields'
import type { EnumOption, Field, FormMode, ResourceDef, Values } from './types'

const required = { error: () => m.db_field_required() }

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
			let number = z.number()
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
				const result = schema.safeParse(values[field.key])
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
