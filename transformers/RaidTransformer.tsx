import * as Element from './ElementTransformer'
import * as RaidGroup from './RaidGroupTransformer'

// Transforms API response to Raid object
export function toObject(data: any): Raid {
  return {
    id: data.id,
    group: data.group && RaidGroup.toObject(data.group),
    name: {
      en: data.name.en,
      ja: data.name.ja,
    },
    element: Element.toObject(data.element),
    level: data.level,
    slug: data.slug,
  }
}
