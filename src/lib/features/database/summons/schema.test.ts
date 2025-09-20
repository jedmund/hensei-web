import { describe, it, expect } from 'vitest'
import { toEditData, toPayload, SummonEditSchema } from './schema'

describe('summons/schema', () => {
  const model = {
    name: { en: 'Bahamut' },
    granblue_id: '2040004000',
    rarity: 4,
    element: 5,
    hp: { min_hp: 100, max_hp: 900, max_hp_flb: 1000 },
    atk: { min_atk: 300, max_atk: 2400, max_atk_flb: 2600 },
    uncap: { flb: true, ulb: true, transcendence: false }
  }

  it('toEditData maps model to edit state', () => {
    const edit = toEditData(model)
    expect(edit.granblue_id).toBe('2040004000')
    expect(edit.flb).toBe(true)
    expect(edit.ulb).toBe(true)
  })

  it('toPayload maps edit state to API payload', () => {
    const edit = toEditData(model)
    const payload = toPayload(edit)
    expect(payload.uncap.ulb).toBe(true)
  })

  it('SummonEditSchema validates a correct edit state', () => {
    const edit = toEditData(model)
    const parsed = SummonEditSchema.parse(edit)
    expect(parsed.granblue_id).toBe('2040004000')
  })

  it('SummonEditSchema rejects invalid edit state', () => {
    const bad = { ...toEditData(model), granblue_id: '' }
    const res = SummonEditSchema.safeParse(bad)
    expect(res.success).toBe(false)
  })
})
