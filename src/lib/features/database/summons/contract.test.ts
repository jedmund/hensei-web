/**
 * The summons schema must only use what the API publishes at
 * GET /admin/summons/schema: filters, flags, sorts, fields, writable params
 * and enum values.
 *
 * The fixture is a copy of hensei-api's spec/fixtures/admin_schema/summons.json.
 * When the API changes it (UPDATE_ADMIN_SCHEMA_FIXTURES=1 in its schema spec),
 * copy it here, run Prettier on it, and fix whatever this test reports.
 */
import { describe, expect, it } from 'vitest'
import { describeContract } from '$lib/features/database/schema/contract'
import { fromRecord, toPayload } from '$lib/features/database/schema/form'
import { summonsResource } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'
import api from './__fixtures__/admin-schema.json'

describeContract(summonsResource, api)

describe('summons contract: read-only values', () => {
	it('never writes the uncap stars or the list-only counts', () => {
		const writable = new Set(Object.keys(api.writable))
		const sent = Object.keys(
			toPayload(summonsResource, fromRecord(summonsResource, detailRecords.transcended), 'edit')
		)
		for (const key of ['uncap', 'latest_date', 'updated_at', 'aura_count']) {
			expect(sent).not.toContain(key)
		}
		expect(sent.filter((key) => !writable.has(key))).toEqual([])
	})

	it('offers the elements the API accepts, which leave out Null', () => {
		const element = summonsResource.fields.find((f) => f.key === 'element')
		if (element?.kind !== 'enum') throw new Error('no element enum')
		expect(element.options().map((o) => o.value)).toEqual(Object.values(api.enums.element))
	})
})
