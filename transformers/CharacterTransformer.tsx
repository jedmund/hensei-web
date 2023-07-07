import * as Element from './ElementTransformer'

// Transforms API response to Character object
export function toObject(data: any): Character {
  return {
    type: 'character',
    id: data.id,
    granblueId: data.granblue_id,
    characterId: data.character_id,
    name: {
      en: data.name.en,
      ja: data.name.jp,
    },
    element: Element.toObject(data.element),
    rarity: data.rarity,
    proficiency: data.proficiency,
    gender: data.gender,
    race: data.race,
    hp: {
      min: data.hp.min,
      max: data.hp.max,
      flb: data.hp.max_hp_flb,
      ulb: data.hp.max_hp_ulb,
    },
    atk: {
      min: data.atk.min,
      max: data.atk.max,
      flb: data.atk.max_atk_flb,
      ulb: data.atk.max_atk_ulb,
    },
    uncap: {
      flb: data.uncap.flb,
      ulb: data.uncap.ulb,
    },
    awakenings: data.awakenings.map((awakening: any) =>
      Awakening.toObject(awakening)
    ),
    special: data.special,
  }
}
