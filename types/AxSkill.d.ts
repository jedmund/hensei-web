interface AxSkill {
  name: {
    [key: string]: string
    en: string
    ja: string
  }
  id: number
  minValue: number
  maxValue: number
  suffix?: string
  secondary?: AxSkill[]
}
