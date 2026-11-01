/**
 * The contract every resource definition keeps with its API schema
 * (GET /admin/:resource/schema): it only filters, sorts, requests and writes
 * what the API publishes, and offers only published enum values. Each
 * resource's contract test runs it against a copy of the API's fixture
 * (hensei-api spec/fixtures/admin_schema/<resource>.json, Prettier'd).
 */
import { describe, expect, it } from 'vitest'
import { columnsFor, filtersFor } from './columns'
import { formFields } from './fields'
import type { AnyResourceDef } from './registry'
import type { Field, FormMode } from './types'

export interface AdminSchema {
	filters: Record<string, unknown>
	flags: string[]
	sorts: string[]
	fields: string[]
	writable: Record<string, string>
	/** Label → value. Values are numbers, or strings for string enums (e.g. `object_type`) */
	enums: Record<string, Record<string, number | string>>
}

type AnyField = Field<unknown, unknown>

/** The params a field writes */
export function writeKeys(field: AnyField): string[] {
	if (field.kind === 'localized') return [field.keys.en, field.keys.ja]
	if (typeof field.write === 'string') return [field.write]
	if (typeof field.write === 'object') return [field.write.key ?? field.key]
	return [field.key]
}

export function describeContract(def: AnyResourceDef, api: AdminSchema) {
	const filterNames = new Set([...Object.keys(api.filters), ...api.flags])
	const sorts = new Set(api.sorts)
	const fields = new Set(api.fields)
	const writable = new Set(Object.keys(api.writable))

	describe(`${def.name} schema matches the API contract`, () => {
		const columns = columnsFor(def)

		it('only filters on published filters and flags', () => {
			const used = filtersFor(def).flatMap((filter) =>
				filter.kind === 'toggles' ? filter.toggles.map((t) => t.key) : [filter.key]
			)
			expect(used.filter((key) => !filterNames.has(key))).toEqual([])
		})

		it('only sorts on published sorts', () => {
			const used = columns
				.filter((column) => column.sortable !== false && (column.value || column.type === 'name'))
				.map((column) => column.sortField ?? column.id)
			expect(used.filter((key) => !sorts.has(key))).toEqual([])
		})

		it('only requests published fields', () => {
			const used = [
				...def.list.baseFields,
				...(def.list.element ? [def.list.element] : []),
				...columns.flatMap((column) => column.fields ?? [])
			]
			expect(used.filter((key) => !fields.has(key))).toEqual([])
		})

		it.each<FormMode>(['edit', 'create'])('only writes writable params (%s)', (mode) => {
			const used = formFields(def, mode).flatMap((field) =>
				field.write === false ? [] : writeKeys(field as AnyField)
			)
			expect(used.filter((key) => !writable.has(key))).toEqual([])
		})

		it('offers only published enum values', () => {
			const mismatched = def.fields.flatMap((field: AnyField) => {
				if (field.kind !== 'enum' && field.kind !== 'enumList') return []
				const published = api.enums[field.key]
				if (!published) return []
				// Rails enums take their names (augment_type: 'ax') as well as their values
				const allowed = new Set<unknown>([...Object.values(published), ...Object.keys(published)])
				return field
					.options()
					.filter((option) => !allowed.has(option.value))
					.map((option) => `${field.key}=${option.value}`)
			})
			expect(mismatched).toEqual([])
		})
	})
}
