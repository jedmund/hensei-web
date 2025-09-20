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
    hp: { min_hp: 200, max_hp: 1500, max_hp_flb: 1600 },
    atk: { min_atk: 800, max_atk: 7200, max_atk_flb: 7400 },
    uncap: { flb: true, ulb: false, transcendence: false },
    special: false
  }

  it('toEditData maps model to edit state', () => {
    const edit = toEditData(model)
    expect(edit.granblue_id).toBe('3040109000')
    expect(edit.race1).toBe(2)
    expect(edit.race2).toBeNull()
    expect(edit.flb).toBe(true)
  })

  it('toPayload maps edit state to API payload', () => {
    const edit = toEditData(model)
    const payload = toPayload(edit)
    expect(payload.race).toEqual([2])
    expect(payload.uncap.flb).toBe(true)
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
})

