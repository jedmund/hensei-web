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
import { describeContract } from '$lib/features/database/schema/contract'
import { fromRecord, toPayload } from '$lib/features/database/schema/form'
import { weaponsResource } from './resource'
import api from './__fixtures__/admin-schema.json'

describeContract(weaponsResource, api)

describe('weapons contract: form-only values', () => {
	it('never writes form-only values (the awakening switch)', () => {
		const writable = new Set(Object.keys(api.writable))
		const sent = Object.keys(
			toPayload(weaponsResource, fromRecord(weaponsResource, { granblueId: 'x' } as never), 'edit')
		)
		expect(sent).not.toContain('awakening')
		expect(sent.filter((key) => !writable.has(key))).toEqual([])
	})
})
