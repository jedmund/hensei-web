interface Job {
  id: string
  granblueId: string
  name: {
    [key: string]: string
    en: string
    ja: string
  }
  proficiency: {
    proficiency1: number
    proficiency2: number
  }
  row: string
  masterLevel: boolean
  ultimateMastery: boolean
  order: number
  accessory: boolean
  accessory_type: number
}
