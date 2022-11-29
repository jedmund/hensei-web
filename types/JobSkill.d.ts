interface JobSkill {
  id: string
  job: Job
  name: {
    [key: string]: string
    en: string
    ja: string
  }
  slug: string
  color: number
  main: boolean
  base: boolean
  sub: boolean
  emp: boolean
  order: number
}
