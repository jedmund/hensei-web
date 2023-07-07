import * as Element from './ElementTransformer'

// Transforms API response to Summon object
export function toObject(data: any): Summon {
  return {
    type: 'summon',
    id: data.id,
    granblueId: data.granblueId,
    name: {
      en: data.name.en,
      ja: data.name.jp,
    },
    element: Element.toObject(data.element),
    rarity: data.rarity,
    maxLevel: data.max_level,
    hp: {
      min: data.hp.min,
      max: data.hp.max,
      flb: data.hp.max_hp_flb,
      ulb: data.hp.max_hp_ulb,
      xlb: data.hp.max_hp_xlb,
    },
    atk: {
      min: data.atk.min,
      max: data.atk.max,
      flb: data.atk.max_atk_flb,
      ulb: data.atk.max_atk_ulb,
      xlb: data.atk.max_atk_xlb,
    },
    uncap: {
      flb: data.uncap.flb,
      ulb: data.uncap.ulb,
      xlb: data.uncap.xlb,
    },
  }
}
