/**
 * The characters schema must only use what the API publishes at
 * GET /admin/characters/schema: filters, flags, sorts, fields, writable
 * params and enum values.
 *
 * The fixture is a copy of hensei-api's spec/fixtures/admin_schema/characters.json.
 * When the API changes it (UPDATE_ADMIN_SCHEMA_FIXTURES=1 in its schema spec),
 * copy it here, run Prettier on it, and fix whatever this test reports.
 */
import { describe, expect, it } from 'vitest'
import { describeContract } from '$lib/features/database/schema/contract'
import { fromRecord, toPayload } from '$lib/features/database/schema/form'
import { charactersResource } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'
import api from './__fixtures__/admin-schema.json'

describeContract(charactersResource, api)

describe('characters contract: read-only values', () => {
	it('never writes the reverse references or the list-only proficiency pair', () => {
		const writable = new Set(Object.keys(api.writable))
		const sent = Object.keys(
			toPayload(
				charactersResource,
				fromRecord(charactersResource, detailRecords.transcended),
				'edit'
			)
		)
		for (const key of ['recruited_by', 'base_character', 'promotions', 'proficiency', 'related']) {
			expect(sent).not.toContain(key)
		}
		expect(sent.filter((key) => !writable.has(key))).toEqual([])
	})
})
