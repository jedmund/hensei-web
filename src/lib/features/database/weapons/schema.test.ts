import { describe, it, expect } from 'vitest'
import { toEditData, toPayload, WeaponEditSchema } from './schema'

describe('weapons/schema', () => {
  const model = {
    name: { en: 'Indra Sword' },
    granblue_id: '1040000000',
    rarity: 4,
    element: 6,
    proficiency: [1, 2],
    hp: { min_hp: 30, max_hp: 230, max_hp_flb: 260 },
    atk: { min_atk: 380, max_atk: 2840, max_atk_flb: 3000 },
    uncap: { flb: true, ulb: false, transcendence: false }
  }

  it('toEditData maps model to edit state', () => {
    const edit = toEditData(model)
    expect(edit.granblue_id).toBe('1040000000')
    expect(edit.proficiency1).toBe(1)
    expect(edit.proficiency2).toBe(2)
    expect(edit.flb).toBe(true)
  })

  it('toPayload maps edit state to API payload', () => {
    const edit = toEditData(model)
    const payload = toPayload(edit)
    expect(payload.proficiency).toEqual([1, 2])
    expect(payload.uncap.flb).toBe(true)
  })

  it('WeaponEditSchema validates a correct edit state', () => {
    const edit = toEditData(model)
    const parsed = WeaponEditSchema.parse(edit)
    expect(parsed.granblue_id).toBe('1040000000')
  })

  it('WeaponEditSchema rejects invalid edit state', () => {
    const bad = { ...toEditData(model), granblue_id: '' }
    const res = WeaponEditSchema.safeParse(bad)
    expect(res.success).toBe(false)
  })
})

