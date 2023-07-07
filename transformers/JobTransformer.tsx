// Transforms API response to Job object
export function toObject(data: any): Job {
  return {
    id: data.id,
    granblueId: data.granblue_id,
    name: {
      en: data.name.en,
      ja: data.name.ja,
    },
    row: data.row,
    order: data.order,
    masterLevel: data.master_level,
    ultimateMastery: data.ultimate_mastery,
    proficiency: {
      proficiency1: data.proficiency?.[0] ?? null,
      proficiency2: data.proficiency?.[1] ?? null,
    },
    accessory: data.accessory,
    accessory_type: data.accessory_type,
  }
}
