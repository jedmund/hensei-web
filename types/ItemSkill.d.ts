interface ItemSkill {
  name: {
    [key: string]: string
    en: string
    ja: string
  }
  id: number
  granblueId: string
  slug: string
  minValue: number
  maxValue: number
  fractional: boolean
  suffix?: string
  secondary?: ItemSkill[]
  values?: number[]
}
