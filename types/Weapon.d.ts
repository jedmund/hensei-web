interface Weapon {
  type: 'weapon'
  id: string
  granblueId: number
  element: GranblueElement
  proficiency: number
  rarity: number
  maxLevel: number
  maxSkillLevel: number
  maxAwakeningLevel: number
  series: number
  ax: boolean
  axType: number
  awakenings: Awakening[]
  name: {
    [key: string]: string
    en: string
    ja: string
  }
  hp: {
    min: number
    max: number
    flb: number
    ulb: number
  }
  atk: {
    min: number
    max: number
    flb: number
    ulb: number
  }
  uncap: {
    flb: boolean
    ulb: boolean
  }
}
