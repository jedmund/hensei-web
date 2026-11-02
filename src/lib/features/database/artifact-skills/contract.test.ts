/**
 * The artifact skills schema must only use what the API publishes at
 * GET /admin/artifact_skills/schema: filters, flags, sorts, fields, writable
 * params and enum values.
 *
 * The fixture is a copy of hensei-api's spec/fixtures/admin_schema/artifact_skills.json.
 * When the API changes it (UPDATE_ADMIN_SCHEMA_FIXTURES=1 in its schema spec),
 * copy it here, run Prettier on it, and fix whatever this test reports.
 */
import { describeContract } from '$lib/features/database/schema/contract'
import { artifactSkillsResource } from './resource'
import api from './__fixtures__/admin-schema.json'

describeContract(artifactSkillsResource, api)
