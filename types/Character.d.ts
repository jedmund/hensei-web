interface Character {
  type: 'character'
  id: string
  granblueId: string
  characterId: number[]
  element: GranblueElement
  rarity: number
  gender: number
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
  race: {
    race1: number
    race2: number
  }
  proficiency: number[]
  awakenings: Awakening[]
  special: boolean
}
