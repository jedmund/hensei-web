import * as Element from './ElementTransformer'
import * as RaidGroup from './RaidGroupTransformer'

// Transforms API response to Raid object
export function toObject(data: any): Raid {
  return {
    id: data.id,
    group: RaidGroup.toObject(data.group),
    name: {
      en: data.name_en,
      ja: data.name_jp,
    },
    element: Element.toObject(data.element),
    level: data.level,
    slug: data.slug,
  }
}
