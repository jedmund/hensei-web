/**
 * Parity: the job skills resource must reproduce what the hand-written job
 * skill pages did: the old Skills tab's columns, and the edit and new pages'
 * payloads (transcribed below), with the changes decided for GBF-143 applied
 * on top.
 */
import { describe, expect, it } from 'vitest'
import { columnHeader } from '$lib/components/data-table/types'
import { columnsFor, filtersFor } from '$lib/features/database/schema/columns'
import { recordHref } from '$lib/features/database/schema/detail'
import {
	applyDerive,
	formSections,
	fromRecord,
	initialValues,
	prefillFrom,
	toPayload
} from '$lib/features/database/schema/form'
import { buildZod, issueErrors, issueMessage } from '$lib/features/database/schema/validation'
import type { Values } from '$lib/features/database/schema/types'
import type { JobSkill } from '$lib/types/api/entities'
import type { AdminJobSkillRow } from '$lib/types/api/admin'
import { jobSkillsResource as def, slugify } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'

const { mainSub, emp, unflagged } = detailRecords

const row: AdminJobSkillRow = {
	id: 's-rage',
	nameEn: 'Rage IV',
	nameJp: 'レイジIV',
	slug: 'rage-iv',
	color: 2,
	main: true,
	sub: true,
	emp: false,
	base: false,
	order: 1,
	job: { id: 'j-paladin', granblueId: '100401', nameEn: 'Paladin', nameJp: 'パラディン' },
	updatedAt: '2026-10-01T00:00:00Z'
}

describe('job skills resource: list', () => {
	const columns = columnsFor(def)
	const column = (id: string) => columns.find((c) => c.id === id)!

	// The old Skills tab: icon, Name, Type, Job, Color, Order. The rest are new and hidden
	it("keeps the old tab's columns, with the rest available", () => {
		expect(columns.map((c) => [c.id, columnHeader(c), c.defaultHidden ?? false])).toEqual([
			['icon', '', false],
			['name', 'Name', false],
			['kind', 'Type', false],
			['job', 'Job', false],
			['color', 'Color', false],
			['order', 'Order', false],
			['slug', 'Slug', true],
			['image_id', 'Image ID', true],
			['action_id', 'Action ID', true],
			['main', 'Main', true],
			['sub', 'Subskill', true],
			['emp', 'EMP', true],
			['base', 'Base', true],
			['updated_at', 'Last edited', true]
		])
	})

	// The old Type badge showed only the first kind: Rage IV read as Main
	it('shows every kind a skill has, its job and colour', () => {
		const kind = column('kind')
		expect(kind.type === 'flags' && kind.flags(row).map((f) => f.label)).toEqual([
			'Main',
			'Subskill'
		])
		expect(column('job').value!(row)).toBe('Paladin')
		expect(column('color').value!(row)).toBe('Red')
	})

	// The API sorts on a skill's own columns: no sorting by job name, as the old tab did
	it("can't sort by job", () => {
		expect(column('job').sortable).toBe(false)
		expect(def.list.defaultSort).toEqual([{ id: 'name', desc: false }])
	})

	it('filters on job, colour, kind and edits (the old tab had a kind select)', () => {
		expect(
			filtersFor(def).map((f) =>
				f.kind === 'toggles' ? [f.id, f.toggles.map((t) => t.key)] : f.key
			)
		).toEqual(['job', 'color', ['kind', ['main', 'sub', 'emp', 'base']], 'updated_at'])
	})

	it('identifies rows and pages by id: skills have no Granblue ID', () => {
		expect(def.list.rowId!(row)).toBe('s-rage')
		expect(recordHref(def, mainSub)).toBe('/database/job-skills/s-rage')
	})
})

// --- Edit: the old page, transcribed ---

/** The old single Skill Type select, from the record */
function legacyType(skill: JobSkill) {
	if (skill.main) return 'main'
	if (skill.sub) return 'sub'
	if (skill.emp) return 'emp'
	if (skill.base) return 'base'
	return 'main'
}

/** The edit page's `saveChanges` payload for the record */
function legacyEdit(skill: JobSkill) {
	const type = legacyType(skill)
	return {
		name_en: skill.name?.en || '',
		name_jp: skill.name?.ja || undefined,
		slug: skill.slug || '',
		color: skill.color ?? 0,
		main: type === 'main',
		sub: type === 'sub',
		emp: type === 'emp',
		base: type === 'base',
		order: skill.order ?? 0,
		image_id: skill.imageId || undefined,
		action_id: skill.actionId || undefined
	}
}

/**
 * The decided changes: the kinds are four checkboxes, so a main skill that is
 * also a subskill keeps both (the select saved it as main only), and a skill
 * with none stays that way; blanks send null rather than being left out; the
 * job can change (job_id)
 */
function decided(skill: JobSkill) {
	const legacy = legacyEdit(skill)
	return {
		...legacy,
		main: skill.main,
		sub: skill.sub,
		emp: skill.emp,
		base: skill.base,
		name_jp: legacy.name_jp ?? null,
		image_id: legacy.image_id ?? null,
		action_id: legacy.action_id ?? null,
		job_id: skill.job.id
	}
}

const editPayload = (skill: JobSkill) => toPayload(def, fromRecord(def, skill), 'edit')

describe('job skills resource: edit payload parity', () => {
	it('matches the edit page, with the decided changes', () => {
		for (const skill of [mainSub, emp, unflagged]) {
			expect(editPayload(skill)).toEqual(decided(skill))
		}
	})

	it('keeps both kinds of a main skill that is also a subskill', () => {
		expect(editPayload(mainSub)).toMatchObject({ main: true, sub: true })
		expect(legacyEdit(mainSub)).toMatchObject({ main: true, sub: false })
	})
})

describe('job skills resource: create', () => {
	it("sends the new page's keys, with the job as a param", () => {
		const sent = Object.keys(toPayload(def, initialValues(def), 'create'))
		expect(sent.toSorted()).toEqual([...Object.keys(legacyEdit(emp)), 'job_id'].toSorted())
	})

	it("presets the job from a job's Add skill link", () => {
		const prefill = prefillFrom(def, new URLSearchParams('job=j-paladin&color=3'))
		expect(prefill).toEqual({ job: 'j-paladin' })
		expect(initialValues(def, prefill)).toMatchObject({ job: 'j-paladin', color: 0 })
	})

	it('fills the slug from the English name until it is edited by hand', () => {
		let values = initialValues(def)
		const set = (key: string, value: unknown) =>
			(values = applyDerive(def, { ...values, [key]: value }, key))

		set('name', { en: 'Rage IV', ja: '' })
		expect(values.slug).toBe('rage-iv')
		set('name', { en: "Parfait d'Amour", ja: '' })
		expect(values.slug).toBe('parfait-damour')
		set('slug', 'parfait')
		expect(values.slug_auto).toBe(false)
		set('name', { en: 'Parfait II', ja: '' })
		expect(values.slug).toBe('parfait')
	})

	it('leaves the slug alone on the edit form', () => {
		const values = fromRecord(def, mainSub)
		expect('slug_auto' in values).toBe(false)
		expect(applyDerive(def, { ...values, name: { en: 'Rage V', ja: '' } }, 'name').slug).toBe(
			'rage-iv'
		)
	})

	it('slugifies like the old new page', () => {
		expect(slugify('  Armor  Break ')).toBe('armor-break')
		expect(slugify('Ain - Soph')).toBe('ain-soph')
	})
})

describe('job skills resource: forms', () => {
	it('edit every writable field; the slug box is on the new page only', () => {
		const keys = (mode: 'edit' | 'create') =>
			formSections(def, mode).map(({ section, fields }) => [section.id, fields.map((f) => f.key)])
		expect(keys('edit')).toEqual([
			['metadata', ['name', 'slug', 'image_id', 'action_id']],
			['classification', ['main', 'sub', 'emp', 'base', 'color', 'order']],
			['job', ['job']]
		])
		expect(keys('create')[0]).toEqual([
			'metadata',
			['name', 'slug', 'slug_auto', 'image_id', 'action_id']
		])
	})
})

function errors(values: Values) {
	const result = buildZod(def, 'edit').safeParse(values, { error: issueMessage })
	return result.success ? {} : issueErrors(result.error.issues)
}

describe('job skills resource: validation', () => {
	it('accepts loaded skills', () => {
		expect(errors(fromRecord(def, mainSub))).toEqual({})
		expect(errors(fromRecord(def, emp))).toEqual({})
	})

	it('requires a kebab-case slug, a job and a positive action ID', () => {
		expect(
			errors({ ...fromRecord(def, mainSub), slug: 'Rage IV', job: null, action_id: 0 })
		).toMatchObject({
			slug: 'Use lowercase letters, digits and single hyphens',
			job: 'Required',
			action_id: 'Must be at least 1'
		})
	})
})
