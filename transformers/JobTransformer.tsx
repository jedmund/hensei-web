// Transforms API response to Job object
export function toObject(data: any): Job {
  return {
    id: data.id,
    granblueId: data.granblueId,
    name: {
      en: data.name.en,
      ja: data.name.jp,
    },
    baseJob: toObject(data.base_job),
    row: data.row,
    order: data.order,
    masterLevel: data.master_level,
    ultimateMastery: data.ultimate_mastery,
    proficiency: {
      proficiency1: data.proficiency1,
      proficiency2: data.proficiency2,
    },
    accessory: data.accessory,
    accessory_type: data.accessory_type,
  }
}
