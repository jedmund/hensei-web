import * as Raid from './RaidTransformer'

// Transforms API response to RaidGroup object
export function toObject(data: any) {
  return {
    id: data.id,
    name: {
      en: data.name_en,
      ja: data.name_jp,
    },
    raids: data.raids.map((raid: any) => Raid.toObject(raid)),
    difficulty: data.difficulty,
    section: data.section,
    order: data.order,
    extra: data.extra,
    guidebooks: data.guidebooks,
    hl: data.hl,
  } as RaidGroup
}
