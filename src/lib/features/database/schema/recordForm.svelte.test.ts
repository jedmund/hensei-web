import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// jsdom has no matchMedia; hoisted, as modules read it on import
vi.hoisted(() => {
	window.matchMedia ??= ((query: string) => ({
		matches: true,
		media: query,
		addEventListener() {},
		removeEventListener() {}
	})) as unknown as typeof window.matchMedia
})

const client = vi.hoisted(() => ({ invalidateQueries: vi.fn(async () => {}) }))

vi.mock('$app/navigation', () => ({ beforeNavigate: vi.fn(), goto: vi.fn(async () => {}) }))
vi.mock('@tanstack/svelte-query', async (importOriginal) => ({
	...(await importOriginal<typeof import('@tanstack/svelte-query')>()),
	useQueryClient: () => client
}))

import type { Weapon } from '$lib/api/adapters/weapon.adapter'
import { UnsavedChangesGuard } from '$lib/features/database/detail/unsavedChanges.svelte'
import { weaponsResource } from '$lib/features/database/weapons/resource'
import { ASYNC_CHECK_DELAY, createRecordForm } from './recordForm.svelte'

const weapon: Weapon = {
	id: 'weapon-uuid',
	granblueId: '1040912000',
	name: { en: 'Mjolnir', ja: 'ミョルニル' },
	rarity: 3,
	element: 3,
	proficiency: 1,
	series: {
		id: 'series-uuid',
		slug: 'revans',
		name: { en: 'Revans', ja: 'レヴァンス' },
		weaponSeriesVariantId: 'variant-uuid'
	} as Weapon['series'],
	uncap: { flb: true, ulb: false, transcendence: false, extraPrerequisite: null },
	// Not the standard FLB caps: loading must keep them
	maxLevel: 120,
	maxSkillLevel: 12,
	maxAwakeningLevel: 10,
	awakenings: [{ id: 'awk-atk', name: { en: 'Attack' }, level: 1 }],
	releaseDate: '2020-01-01',
	wiki: { en: 'Mjolnir', ja: '' }
}

const update = vi.fn()
const def = { ...weaponsResource, save: { update } }

function setup(record: Weapon = weapon) {
	const form = createRecordForm(def, record)
	const guard = new UnsavedChangesGuard(() => form.values)
	guard.reset()
	return { form, guard }
}

beforeEach(() => {
	update.mockReset()
	client.invalidateQueries.mockClear()
})

describe('createRecordForm', () => {
	it('is not dirty right after load, and is after an edit', () => {
		const { form, guard } = setup()
		expect(guard.dirty).toBe(false)
		form.set('max_hp', 300)
		expect(guard.dirty).toBe(true)
	})

	it('ignores inputs echoing the value they were given', () => {
		const { form, guard } = setup()
		// A select writing back the series it shows must not clear the variant
		form.set('series', 'series-uuid')
		// A date picker turning a blank into null is no edit either
		form.set('flb_date', null)
		expect(form.values.weapon_series_variant_id).toBe('variant-uuid')
		expect(guard.dirty).toBe(false)
	})

	it('keeps the stored caps on load and recalculates them when an uncap changes', () => {
		const { form } = setup()
		expect(form.values).toMatchObject({ max_level: 120, max_skill_level: 12 })
		form.set('max_level', 130)
		expect(form.values.max_level).toBe(130)
		form.set('ulb', true)
		expect(form.values).toMatchObject({ max_level: 200, max_skill_level: 20 })
	})

	it('hides and clears the awakening level and awakenings when awakening is switched off', () => {
		const { form } = setup()
		const field = (key: string) => weaponsResource.fields.find((f) => f.key === key)!
		expect(form.values.awakening).toBe(true)
		expect(form.shown(field('max_awakening_level'))).toBe(true)

		form.set('awakening', false)
		expect(form.values).toMatchObject({ max_awakening_level: null, awakening_ids: [] })
		expect(form.shown(field('max_awakening_level'))).toBe(false)
		expect(form.shown(field('awakening_ids'))).toBe(false)
	})

	it('blocks saving on invalid values, with the errors by field', async () => {
		const { form } = setup()
		form.set('granblue_id', '123')
		form.set('awakening', false)
		form.set('awakening', true)

		expect(await form.save()).toBeNull()
		expect(update).not.toHaveBeenCalled()
		expect(Object.keys(form.errors).sort()).toEqual(['granblue_id', 'max_awakening_level'])

		// Editing a field clears its error
		form.set('granblue_id', '1040912001')
		expect(form.error('granblue_id')).toBeUndefined()
	})

	it("maps the API's 422 errors back onto the fields", async () => {
		update.mockRejectedValue({
			status: 422,
			message: 'Unprocessable',
			details: {
				errors: {
					name_jp: ['is too long'],
					element_variant_ids: ['must map element ids'],
					base: ['Something else']
				}
			}
		})
		const { form } = setup()
		expect(await form.save()).toBeNull()
		expect(form.errors).toEqual({
			'name.ja': 'is too long',
			element_variant_ids: 'must map element ids'
		})
		expect(form.error('name')).toBe('is too long')
		expect(form.formError).toBe('Something else')
	})

	it('reports a failed request without field errors', async () => {
		update.mockRejectedValue({ status: 500, message: 'Server error' })
		const { form } = setup()
		expect(await form.save()).toBeNull()
		expect(form.errors).toEqual({})
		expect(form.formError).toBe('Server error')
	})

	it('saves the payload, then refreshes the record and the lists', async () => {
		update.mockResolvedValue({ ...weapon, granblueId: '1040912999' })
		const { form } = setup()
		form.set('name', { en: 'Mjolnir', ja: '' })

		const saved = await form.save()
		expect(saved?.granblueId).toBe('1040912999')

		const [record, payload] = update.mock.calls[0]!
		expect(record).toBe(weapon)
		expect(payload).toMatchObject({ name_en: 'Mjolnir', name_jp: null, max_level: 120 })
		expect(payload).not.toHaveProperty('awakening')

		const keys = client.invalidateQueries.mock.calls.map(
			(call) => (call as unknown as [{ queryKey: unknown[] }])[0].queryKey
		)
		expect(keys).toEqual([
			['weapon', '1040912000'],
			['weapon', '1040912999'],
			['admin', 'weapons', 'list']
		])
	})
})

describe('createRecordForm without a record (create)', () => {
	const create = vi.fn()
	const afterCreate = vi.fn(async () => {})
	const exists = vi.fn<(id: unknown) => Promise<string | null>>(async () => null)
	const createDef = {
		...weaponsResource,
		save: { create, afterCreate, asyncValidate: { granblue_id: exists } }
	}

	function setupNew() {
		const form = createRecordForm(createDef)
		const guard = new UnsavedChangesGuard(() => form.values)
		guard.reset()
		return { form, guard }
	}

	/** The fields a new weapon needs */
	function fill(form: ReturnType<typeof setupNew>['form']) {
		form.set('granblue_id', '1040914000')
		form.set('name', { en: 'Fresh', ja: '' })
		form.set('proficiency', 1)
	}

	beforeEach(() => {
		vi.useFakeTimers()
		create.mockReset()
		afterCreate.mockClear()
		exists.mockReset()
		exists.mockResolvedValue(null)
	})
	afterEach(() => vi.useRealTimers())

	it('starts from the defaults, clean until something is entered', () => {
		const { form, guard } = setupNew()
		expect(form.mode).toBe('create')
		expect(form.values).toMatchObject({
			rarity: 3,
			element: 0,
			proficiency: null,
			max_level: 100,
			max_skill_level: 10,
			granblue_id: '',
			name: { en: '', ja: '' }
		})
		expect(guard.dirty).toBe(false)
		form.set('min_hp', 10)
		expect(guard.dirty).toBe(true)
	})

	it('requires a Granblue ID, an English name and a proficiency', async () => {
		const { form } = setupNew()
		expect(await form.save()).toBeNull()
		expect(create).not.toHaveBeenCalled()
		expect(Object.keys(form.errors).sort()).toEqual(['granblue_id', 'name.en', 'proficiency'])
	})

	it("doesn't ask the server about an ID that isn't 10 digits", async () => {
		const { form } = setupNew()
		form.set('granblue_id', '104091')
		await vi.advanceTimersByTimeAsync(ASYNC_CHECK_DELAY)
		expect(exists).not.toHaveBeenCalled()
		expect(await form.save()).toBeNull()
		expect(form.error('granblue_id')).toBe('Granblue ID must be exactly 10 digits')
	})

	it('checks the ID once typing pauses, and blocks saving while it exists', async () => {
		exists.mockResolvedValue('A weapon with this Granblue ID already exists')
		const { form } = setupNew()
		fill(form)
		form.set('granblue_id', '1040914001')
		await vi.advanceTimersByTimeAsync(ASYNC_CHECK_DELAY)
		// Debounced: only the value typing stopped at
		expect(exists).toHaveBeenCalledTimes(1)
		expect(exists.mock.calls[0]![0]).toBe('1040914001')
		expect(form.error('granblue_id')).toBe('A weapon with this Granblue ID already exists')

		expect(await form.save()).toBeNull()
		expect(create).not.toHaveBeenCalled()

		// A new ID clears the problem and asks again
		exists.mockResolvedValue(null)
		form.set('granblue_id', '1040914002')
		expect(form.error('granblue_id')).toBeUndefined()
		await vi.advanceTimersByTimeAsync(ASYNC_CHECK_DELAY)
		expect(form.error('granblue_id')).toBeUndefined()
	})

	it('waits for a check still pending when Save is pressed', async () => {
		exists.mockResolvedValue('A weapon with this Granblue ID already exists')
		const { form } = setupNew()
		fill(form)
		// Saved before the debounce runs the check
		expect(await form.save()).toBeNull()
		expect(exists).toHaveBeenCalledWith('1040914000', expect.anything())
		expect(create).not.toHaveBeenCalled()
	})

	it("doesn't block on a check that failed", async () => {
		vi.spyOn(console, 'error').mockImplementationOnce(() => {})
		exists.mockRejectedValue(new Error('down'))
		create.mockResolvedValue({ id: 'new-uuid', granblueId: '1040914000' })
		const { form } = setupNew()
		fill(form)
		expect(await form.save()).not.toBeNull()
	})

	it('creates the record, then runs afterCreate and refreshes the lists', async () => {
		const saved = { id: 'new-uuid', granblueId: '1040914000' }
		create.mockResolvedValue(saved)
		const { form } = setupNew()
		fill(form)

		expect(await form.save()).toBe(saved)
		const [payload] = create.mock.calls[0]!
		expect(payload).toMatchObject({
			granblue_id: '1040914000',
			name_en: 'Fresh',
			name_jp: null,
			proficiency: 1,
			rarity: 3,
			element: 0,
			max_level: 100,
			release_date: null,
			recruits: null
		})
		expect(payload).not.toHaveProperty('new_series')
		expect(afterCreate).toHaveBeenCalledWith(saved)
		const keys = client.invalidateQueries.mock.calls.map(
			(call) => (call as unknown as [{ queryKey: unknown[] }])[0].queryKey
		)
		expect(keys).toEqual([
			['weapon', '1040914000'],
			['admin', 'weapons', 'list']
		])
	})

	it("maps the API's 422 errors back onto the fields", async () => {
		create.mockRejectedValue({
			status: 422,
			message: 'Unprocessable',
			details: { errors: { granblue_id: ['has already been taken'] } }
		})
		const { form } = setupNew()
		fill(form)
		expect(await form.save()).toBeNull()
		expect(form.error('granblue_id')).toBe('has already been taken')
		expect(afterCreate).not.toHaveBeenCalled()
	})

	it('runs no server checks on the edit form', async () => {
		const form = createRecordForm({ ...createDef, save: { ...createDef.save, update } }, weapon)
		form.set('granblue_id', '1040912001')
		await vi.advanceTimersByTimeAsync(ASYNC_CHECK_DELAY)
		expect(exists).not.toHaveBeenCalled()
	})
})
