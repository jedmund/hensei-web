import * as Job from './JobTransformer'

// Transforms API response to JobSkill object
export function toObject(data: any): JobSkill {
  return {
    id: data.id,
    name: {
      en: data.name.en,
      ja: data.name.ja,
    },
    job: Job.toObject(data.job),
    slug: data.slug,
    color: data.color,
    main: data.main,
    base: data.base,
    sub: data.sub,
    emp: data.emp,
    order: data.order,
  }
}
