/**
 * Parity: the jobs resource must reproduce what the hand-written jobs pages
 * did: the old grid's columns, and the edit and new pages' payloads
 * (transcribed below), with the changes decided for GBF-143 applied on top.
 */
import { describe, expect, it } from 'vitest'
import { labelText } from '$lib/components/data-table/filters'
import { columnHeader } from '$lib/components/data-table/types'
import { columnsFor, filtersFor } from '$lib/features/database/schema/columns'
import { recordHref } from '$lib/features/database/schema/detail'
import {
	applyDerive,
	formSections,
	fromRecord,
	initialValues,
	toPayload
} from '$lib/features/database/schema/form'
import { buildZod, issueErrors, issueMessage } from '$lib/features/database/schema/validation'
import type { Values } from '$lib/features/database/schema/types'
import type { Job } from '$lib/types/api/entities'
import type { AdminJobRow } from '$lib/types/api/admin'
import { jobsResource as def } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'

const { paladin, fighter, wizardOrigin } = detailRecords

const row: AdminJobRow = {
	id: 'j-paladin',
	granblueId: '100401',
	nameEn: 'Paladin',
	nameJp: 'パラディン',
	row: '4',
	order: 3,
	proficiency1: 3,
	proficiency2: 1,
	updatedAt: '2026-10-01T00:00:00Z',
	masterLevel: true,
	ultimateMastery: false,
	accessory: true
}

describe('jobs resource: list', () => {
	const columns = columnsFor(def)
	const column = (id: string) => columns.find((c) => c.id === id)!

	// The old grid: icon, Name, Row, Proficiencies, Features. The rest are new and hidden
	it("keeps the old grid's columns, with the order shown and the rest available", () => {
		expect(columns.map((c) => [c.id, columnHeader(c), c.defaultHidden ?? false])).toEqual([
			['icon', '', false],
			['name', 'Name', false],
			['row', 'Row', false],
			['proficiency', 'Proficiencies', false],
			['features', 'Features', false],
			['order', 'Order', false],
			['granblue_id', 'Granblue ID', true],
			['master_level', 'Master Level', true],
			['ultimate_mastery', 'Ultimate Mastery', true],
			['aux_weapon', 'Aux Weapon', true],
			['accessory', 'Has Accessory', true],
			['accessory_type', 'Accessory Type', true],
			['skill_count', 'Skills', true],
			['updated_at', 'Last edited', true]
		])
	})

	it('reads the tier, both proficiencies and the features from a row', () => {
		expect(column('row').value!(row)).toBe('Class IV')
		expect(column('proficiency').value!(row)).toEqual([3, 1])
		const features = column('features')
		expect(features.type === 'flags' && features.flags(row).map((f) => f.label)).toEqual([
			'Master',
			'Accessory'
		])
	})

	it('filters on row, proficiency, accessory type, features, skills and edits (the old grid had none)', () => {
		expect(
			filtersFor(def).map((f) =>
				f.kind === 'toggles' ? [f.id, f.toggles.map((t) => t.key)] : [f.key, labelText(f.label)]
			)
		).toEqual([
			['row', 'Row'],
			['proficiency', 'Proficiencies'],
			['accessory_type', 'Accessory Type'],
			['features', ['master_level', 'ultimate_mastery', 'aux_weapon', 'accessory']],
			['quality', ['no_skills']],
			['updated_at', 'Last edited']
		])
	})

	it('identifies rows by id: Class I and II jobs share a Granblue ID', () => {
		expect(def.list.rowId!(row)).toBe('j-paladin')
		expect(recordHref(def, fighter)).toBe('/database/jobs/j-fighter')
	})

	it('sorts by row, then order, like the job picker', () => {
		expect(def.list.defaultSort).toEqual([
			{ id: 'row', desc: false },
			{ id: 'order', desc: false }
		])
	})
})

// --- Edit: the old page, transcribed ---

/** The edit page's `saveChanges` payload for the record */
function legacyEdit(job: Job) {
	return {
		name_en: job.name?.en || '',
		name_jp: job.name?.ja || '',
		granblue_id: job.granblueId || '',
		row: job.row?.toString() || '1',
		order: job.order || 0,
		proficiency1: job.proficiency?.[0] || 0,
		proficiency2: job.proficiency?.[1] || 0,
		master_level: job.masterLevel || false,
		ultimate_mastery: job.ultimateMastery || false,
		aux_weapon: job.auxWeapon || false,
		accessory: job.accessory || false,
		accessory_type: job.accessoryType || 0
	}
}

const editPayload = (job: Job) => toPayload(def, fromRecord(def, job), 'edit')

describe('jobs resource: edit payload parity', () => {
	// The old page sent aux_weapon, which the API dropped until it was permitted
	it('matches the edit page key for key', () => {
		for (const job of [paladin, fighter, wizardOrigin]) {
			expect(editPayload(job)).toEqual(legacyEdit(job))
		}
	})

	it('sets the accessory type back to None when Has Accessory is unticked', () => {
		const values = { ...fromRecord(def, paladin), accessory: false }
		expect(toPayload(def, values, 'edit')).toMatchObject({ accessory: false, accessory_type: 0 })
	})

	it('sends a blank order as null, so a new job goes last in its row', () => {
		expect(toPayload(def, { ...fromRecord(def, paladin), order: null }, 'edit').order).toBeNull()
	})
})

describe('jobs resource: create payload parity', () => {
	// The old new page sent the same keys as the edit page
	it("sends the edit page's keys", () => {
		const sent = Object.keys(toPayload(def, initialValues(def), 'create'))
		expect(sent.toSorted()).toEqual(Object.keys(legacyEdit(fighter)).toSorted())
	})

	// The old page filled the next order from the jobs list; the API does that now
	it('starts in Class I with no order and the proficiencies to pick', () => {
		expect(initialValues(def)).toMatchObject({
			row: '1',
			order: null,
			proficiency1: null,
			proficiency2: null,
			accessory: false,
			accessory_type: 0
		})
	})
})

describe('jobs resource: forms', () => {
	it('edit every writable field in the detail layout', () => {
		expect(
			formSections(def, 'edit').map(({ section, fields }) => [section.id, fields.map((f) => f.key)])
		).toEqual([
			['metadata', ['name', 'granblue_id', 'row', 'order']],
			['proficiencies', ['proficiency1', 'proficiency2']],
			[
				'features',
				['master_level', 'ultimate_mastery', 'aux_weapon', 'accessory', 'accessory_type']
			]
		])
	})
})

function errors(values: Values, mode: 'edit' | 'create' = 'edit') {
	const result = buildZod(def, mode).safeParse(values, { error: issueMessage })
	return result.success ? {} : issueErrors(result.error.issues)
}

describe('jobs resource: validation', () => {
	it('accepts loaded jobs', () => {
		for (const job of [paladin, fighter, wizardOrigin])
			expect(errors(fromRecord(def, job))).toEqual({})
	})

	it('requires a 6-digit Granblue ID, names and both proficiencies', () => {
		expect(
			errors({
				...fromRecord(def, paladin),
				granblue_id: '1004010',
				name: { en: '', ja: ' ' },
				proficiency2: null
			})
		).toMatchObject({
			granblue_id: 'Granblue ID must be exactly 6 digits',
			'name.en': 'Required',
			proficiency2: 'Choose one of the options'
		})
	})

	it('offers only the stored rows', () => {
		expect(errors({ ...fromRecord(def, paladin), row: 'ex' })).toHaveProperty('row')
		expect(errors({ ...fromRecord(def, paladin), row: 'ex1' })).toEqual({})
	})

	it('derives nothing', () => {
		expect(applyDerive(def, fromRecord(def, paladin), null)).toEqual(fromRecord(def, paladin))
	})
})
