import * as Element from './ElementTransformer'

// Transforms API response to Summon object
export function toObject(data: any): Summon {
  return {
    type: 'summon',
    id: data.id,
    granblueId: data.granblue_id,
    name: {
      en: data.name.en,
      ja: data.name.ja,
    },
    element: Element.toObject(data.element),
    rarity: data.rarity,
    maxLevel: data.max_level,
    hp: {
      min: data.hp.min_hp,
      max: data.hp.max_hp,
      flb: data.hp.max_hp_flb ? data.hp.max_hp_flb : null,
      ulb: data.hp.max_hp_ulb ? data.hp.max_hp_ulb : null,
      xlb: data.hp.max_hp_xlb ? data.hp.max_hp_xlb : null,
    },
    atk: {
      min: data.atk.min_atk,
      max: data.atk.max_atk,
      flb: data.atk.max_atk_flb ? data.atk.max_atk_flb : null,
      ulb: data.atk.max_atk_ulb ? data.atk.max_atk_ulb : null,
      xlb: data.atk.max_atk_xlb ? data.atk.max_atk_xlb : null,
    },
    uncap: {
      flb: data.uncap.flb,
      ulb: data.uncap.ulb,
      xlb: data.uncap.xlb,
    },
  }
}
