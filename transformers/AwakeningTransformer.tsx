// Transforms API response to Awakening object
export function toObject(data: any): Awakening {
  return {
    id: data.id,
    name: {
      en: data.name.en,
      ja: data.name.jp,
    },
    slug: data.slug,
    object_type: data.object_type,
    order: data.order,
  }
}
