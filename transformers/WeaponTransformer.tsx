import * as Awakening from './AwakeningTransformer'
import * as Element from './ElementTransformer'

// Transforms API response to Weapon object
export function toObject(data: any): Weapon {
  return {
    type: 'weapon',
    id: data.id,
    granblueId: data.granblue_id,
    name: {
      en: data.name.en,
      ja: data.name.ja,
    },
    element: Element.toObject(data.element),
    rarity: data.rarity,
    proficiency: data.proficiency,
    series: data.series,
    maxLevel: data.max_level,
    maxSkillLevel: data.max_skill_level,
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
    ax: data.ax,
    axType: data.ax_type,
    awakenings: data.awakenings.map((awakening: any) =>
      Awakening.toObject(awakening)
    ),
    maxAwakeningLevel: data.max_awakening_level,
  }
}
