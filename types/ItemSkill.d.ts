interface ItemSkill {
  name: {
    [key: string]: string
    en: string
    ja: string
  }
  id: number
  slug: string
  minValue: number
  maxValue: number
  suffix?: string
  secondary?: ItemSkill[]
}
