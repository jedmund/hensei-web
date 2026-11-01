/**
 * Parity: the job accessories resource must reproduce what the hand-written
 * accessory pages did: the old Accessories tab's columns, and the edit and
 * new pages' payloads (transcribed below), with the changes decided for
 * GBF-143 applied on top.
 */
import { describe, expect, it } from 'vitest'
import { columnHeader } from '$lib/components/data-table/types'
import { columnsFor, filtersFor } from '$lib/features/database/schema/columns'
import { recordHref } from '$lib/features/database/schema/detail'
import {
	formSections,
	fromRecord,
	initialValues,
	toPayload
} from '$lib/features/database/schema/form'
import { buildZod, issueErrors, issueMessage } from '$lib/features/database/schema/validation'
import type { Values } from '$lib/features/database/schema/types'
import type { JobAccessory } from '$lib/types/api/entities'
import type { AdminJobAccessoryRow } from '$lib/types/api/admin'
import { jobAccessoriesResource as def } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'

const { shield, manatura } = detailRecords

const row: AdminJobAccessoryRow = {
	id: 'a-obelisk',
	granblueId: '4013',
	nameEn: 'Obelisk',
	nameJp: 'オベリスク',
	accessoryType: 1,
	rarity: 3,
	job: { id: 'j-paladin', granblueId: '100401', nameEn: 'Paladin', nameJp: 'パラディン' },
	releaseDate: '2022-01-25',
	updatedAt: '2026-10-01T00:00:00Z'
}

describe('job accessories resource: list', () => {
	const columns = columnsFor(def)
	const column = (id: string) => columns.find((c) => c.id === id)!

	// The old Accessories tab: image, Name, Type, Job, Rarity. The rest are new
	it("keeps the old tab's columns, with the ID and release date shown", () => {
		expect(columns.map((c) => [c.id, columnHeader(c), c.defaultHidden ?? false])).toEqual([
			['image', '', false],
			['name', 'Name', false],
			['accessory_type', 'Accessory Type', false],
			['job', 'Job', false],
			['rarity', 'Rarity', false],
			['granblue_id', 'Granblue ID', false],
			['release_date', 'Release Date', false],
			['updated_at', 'Last edited', true]
		])
	})

	it('reads the type, job and rarity from a row', () => {
		expect(column('accessory_type').value!(row)).toBe('Shield')
		expect(column('job').value!(row)).toBe('Paladin')
		expect(column('rarity').value!(row)).toBe('SSR')
		expect(column('job').sortable).toBe(false)
	})

	it('filters on type (the old tab had a type select), rarity, job and edits', () => {
		expect(filtersFor(def).map((f) => (f.kind === 'toggles' ? f.id : f.key))).toEqual([
			'accessory_type',
			'rarity',
			'job',
			'updated_at'
		])
	})

	it('sorts by type, then Granblue ID, like the old tab', () => {
		expect(def.list.defaultSort).toEqual([
			{ id: 'accessory_type', desc: false },
			{ id: 'granblue_id', desc: false }
		])
		expect(recordHref(def, shield)).toBe('/database/job-accessories/4013')
	})
})

// --- Edit: the old page, transcribed ---

/**
 * The edit page's `saveChanges` payload. `job_id` was the first job with the
 * accessory's type (`matchedJob`); two jobs take each type, so it's picked now
 */
function legacyEdit(accessory: JobAccessory, matchedJobId: string | undefined) {
	return {
		name_en: accessory.name?.en || '',
		name_jp: accessory.name?.ja || '',
		granblue_id: accessory.granblueId || '',
		accessory_type: accessory.accessoryType || 1,
		rarity: accessory.rarity || 0,
		release_date: accessory.releaseDate || undefined,
		job_id: matchedJobId
	}
}

const editPayload = (accessory: JobAccessory) => toPayload(def, fromRecord(def, accessory), 'edit')

describe('job accessories resource: edit payload parity', () => {
	// Decided: the job is the accessory's own (picked on the form); a blank date sends null
	it('matches the edit page, with the job picked rather than matched by type', () => {
		expect(editPayload(shield)).toEqual(legacyEdit(shield, 'j-paladin'))
		expect(editPayload(manatura)).toEqual({
			...legacyEdit(manatura, 'j-wizard-origin'),
			release_date: null
		})
	})
})

describe('job accessories resource: create', () => {
	it("sends the new page's keys", () => {
		const sent = Object.keys(toPayload(def, initialValues(def), 'create'))
		expect(sent.toSorted()).toEqual(Object.keys(legacyEdit(shield, 'x')).toSorted())
	})

	it('starts from the new page defaults: a shield, SSR', () => {
		expect(initialValues(def)).toMatchObject({ accessory_type: 1, rarity: 3, job: null })
	})
})

describe('job accessories resource: forms', () => {
	it('edit every writable field in the detail layout', () => {
		expect(
			formSections(def, 'edit').map(({ section, fields }) => [section.id, fields.map((f) => f.key)])
		).toEqual([
			['metadata', ['name', 'rarity', 'granblue_id']],
			['classification', ['accessory_type', 'release_date']],
			['job', ['job']]
		])
	})
})

function errors(values: Values) {
	const result = buildZod(def, 'edit').safeParse(values, { error: issueMessage })
	return result.success ? {} : issueErrors(result.error.issues)
}

describe('job accessories resource: validation', () => {
	it('accepts loaded accessories', () => {
		expect(errors(fromRecord(def, shield))).toEqual({})
		expect(errors(fromRecord(def, manatura))).toEqual({})
	})

	// The seven older manaturas store rarity 0, which the API now rejects
	it('requires a numeric Granblue ID and a job, and takes no rarity 0', () => {
		expect(
			errors({ ...fromRecord(def, shield), granblue_id: 'A1', job: null, rarity: 0 })
		).toMatchObject({
			granblue_id: 'Granblue ID must be digits',
			job: 'Required',
			rarity: 'Choose one of the options'
		})
		expect(errors({ ...fromRecord(def, shield), rarity: null })).toEqual({})
	})
})
