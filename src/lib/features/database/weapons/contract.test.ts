/**
 * The weapons schema must only use what the API publishes at
 * GET /admin/weapons/schema: filters, flags, sorts, fields, writable params
 * and enum values.
 *
 * The fixture is a copy of hensei-api's spec/fixtures/admin_schema/weapons.json.
 * When the API changes it (UPDATE_ADMIN_SCHEMA_FIXTURES=1 in its schema spec),
 * copy it here, run Prettier on it, and fix whatever this test reports.
 */
import { describe, expect, it } from 'vitest'
import { columnsFor, filtersFor } from '$lib/features/database/schema/columns'
import { formFields } from '$lib/features/database/schema/fields'
import { fromRecord, toPayload } from '$lib/features/database/schema/form'
import type { Field, FormMode } from '$lib/features/database/schema/types'
import { weaponsResource } from './resource'
import api from './__fixtures__/admin-schema.json'

type AnyField = Field<unknown, unknown>

const filterNames = new Set([...Object.keys(api.filters), ...api.flags])
const sorts = new Set(api.sorts)
const fields = new Set(api.fields)
const writable = new Set(Object.keys(api.writable))
const enums = api.enums as Record<string, Record<string, number>>

function writeKeys(field: AnyField): string[] {
	if (field.kind === 'localized') return [field.keys.en, field.keys.ja]
	if (typeof field.write === 'string') return [field.write]
	if (typeof field.write === 'object') return [field.write.key ?? field.key]
	return [field.key]
}

describe('weapons schema matches the API contract', () => {
	const columns = columnsFor(weaponsResource)

	it('only filters on published filters and flags', () => {
		const used = filtersFor(weaponsResource).flatMap((filter) =>
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
			...weaponsResource.list.baseFields,
			...columns.flatMap((column) => column.fields ?? [])
		]
		expect(used.filter((key) => !fields.has(key))).toEqual([])
	})

	it.each<FormMode>(['edit', 'create'])('only writes writable params (%s)', (mode) => {
		const used = formFields(weaponsResource, mode).flatMap((field) =>
			field.write === false ? [] : writeKeys(field as AnyField)
		)
		expect(used.filter((key) => !writable.has(key))).toEqual([])
	})

	it('never writes form-only values (the awakening switch)', () => {
		const sent = Object.keys(
			toPayload(weaponsResource, fromRecord(weaponsResource, { granblueId: 'x' } as never), 'edit')
		)
		expect(sent).not.toContain('awakening')
		expect(sent.filter((key) => !writable.has(key))).toEqual([])
	})

	it('offers only published enum values', () => {
		const mismatched = weaponsResource.fields.flatMap((field) => {
			if (field.kind !== 'enum' && field.kind !== 'enumList') return []
			const published = enums[field.key]
			if (!published) return []
			const allowed = new Set(Object.values(published))
			return field
				.options()
				.filter((option) => !allowed.has(Number(option.value)))
				.map((option) => `${field.key}=${option.value}`)
		})
		expect(mismatched).toEqual([])
	})
})
