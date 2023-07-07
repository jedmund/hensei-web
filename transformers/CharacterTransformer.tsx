import * as Awakening from './AwakeningTransformer'
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
      ja: data.name.ja,
    },
    element: Element.toObject(data.element),
    rarity: data.rarity,
    proficiency: data.proficiency,
    gender: data.gender,
    race: data.race,
    hp: {
      min: data.hp.min_hp,
      max: data.hp.max_hp,
      flb: data.hp.max_hp_flb ? data.hp.max_hp_flb : null,
      ulb: data.hp.max_hp_ulb ? data.hp.max_hp_ulb : null,
    },
    atk: {
      min: data.atk.min_atk,
      max: data.atk.max_atk,
      flb: data.atk.max_atk_flb ? data.atk.max_atk_flb : null,
      ulb: data.atk.max_atk_ulb ? data.atk.max_atk_ulb : null,
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
