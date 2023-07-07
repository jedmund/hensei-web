import * as Job from './JobTransformer'

// Transforms API response to JobAccessory object
export function toObject(data: any): JobAccessory {
  return {
    id: data.id,
    granblueId: data.granblue_id,
    name: {
      en: data.name.en,
      ja: data.name.jp,
    },
    job: Job.toObject(data.job),
    rarity: data.rarity,
  }
}
