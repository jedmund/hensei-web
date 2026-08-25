import { describe, it, expect } from 'vitest'
import { toEditData, toPayload, CharacterEditSchema } from './schema'

describe('characters/schema', () => {
	const model = {
		name: { en: 'Narmaya' },
		granblue_id: '3040109000',
		rarity: 4,
		element: 6,
		race: [2, null],
		gender: 2,
		proficiency: [1, 5],
		hp: { min_hp: 200, max_hp: 1500, max_hp_flb: 1600, max_hp_ulb: 1700 },
		atk: { min_atk: 800, max_atk: 7200, max_atk_flb: 7400, max_atk_ulb: 7600 },
		uncap: { flb: true, ulb: false, transcendence: false, max_transcendence_stage: 0 },
		special: false
	}

	it('toEditData maps model to edit state', () => {
		const edit = toEditData(model)
		expect(edit.granblue_id).toBe('3040109000')
		expect(edit.race1).toBe(2)
		expect(edit.race2).toBeNull()
		expect(edit.flb).toBe(true)
		expect(edit.max_hp_ulb).toBe(1700)
		expect(edit.max_transcendence_stage).toBe(0)
	})

	it('toPayload maps edit state to API payload', () => {
		const edit = toEditData(model)
		const payload = toPayload(edit)
		expect(payload.race).toEqual([2])
		expect(payload.uncap.flb).toBe(true)
		expect(payload.uncap.ulb).toBe(false)
		expect(payload.uncap.max_transcendence_stage).toBe(0)
	})

	it('CharacterEditSchema validates a correct edit state', () => {
		const edit = toEditData(model)
		const parsed = CharacterEditSchema.parse(edit)
		expect(parsed.granblue_id).toBe('3040109000')
	})

	it('CharacterEditSchema rejects invalid edit state', () => {
		const bad = { ...toEditData(model), granblue_id: '' }
		const res = CharacterEditSchema.safeParse(bad)
		expect(res.success).toBe(false)
	})

	it('requires an explicit released stage for transcendence', () => {
		const edit = { ...toEditData(model), transcendence: true, max_transcendence_stage: 0 }
		expect(CharacterEditSchema.safeParse(edit).success).toBe(false)
	})

	it('accepts ULB for a special FLB character', () => {
		const edit = { ...toEditData(model), special: true, flb: true, ulb: true }
		expect(CharacterEditSchema.safeParse(edit).success).toBe(true)
	})

	it('keeps story-character ULB separate from transcendence', () => {
		const edit = {
			...toEditData(model),
			special: true,
			flb: true,
			transcendence: true,
			max_transcendence_stage: 1
		}
		expect(CharacterEditSchema.safeParse(edit).success).toBe(false)
	})
})
