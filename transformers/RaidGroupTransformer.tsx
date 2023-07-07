import * as Raid from './RaidTransformer'

// Transforms API response to RaidGroup object
export function toObject(data: any): RaidGroup {
  return {
    id: data.id,
    name: {
      en: data.name.en,
      ja: data.name.ja,
    },
    raids: data.raids
      ? data.raids.map((raid: any) => Raid.toObject(raid))
      : null,
    difficulty: data.difficulty,
    section: data.section,
    order: data.order,
    extra: data.extra,
    guidebooks: data.guidebooks,
    hl: data.hl,
  }
}
