// Transforms API response to Guidebook object
export function toObject(data: any): Guidebook {
  return {
    id: data.id,
    granblueId: data.granblue_id,
    name: {
      en: data.name.en,
      ja: data.name.jp,
    },
    description: {
      en: data.description.en,
      ja: data.description.jp,
    },
  }
}
