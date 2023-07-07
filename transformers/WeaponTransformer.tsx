import * as Element from './ElementTransformer'

// Transforms API response to Weapon object
export function toObject(data: any): Weapon {
  return {
    type: 'weapon',
    id: data.id,
    granblueId: data.granblue_id,
    name: {
      en: data.name.en,
      ja: data.name.jp,
    },
    element: Element.toObject(data.element),
    rarity: data.rarity,
    proficiency: data.proficiency,
    series: data.series,
    maxLevel: data.max_level,
    maxSkillLevel: data.max_skill_level,
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
    ax: data.ax,
    axType: data.ax_type,
    awakenings: data.awakenings.map((awakening: any) =>
      Awakening.toObject(awakening)
    ),
    maxAwakeningLevel: data.max_awakening_level,
  }
}
