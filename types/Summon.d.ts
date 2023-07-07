interface Summon {
  type: 'summon'
  id: string
  granblueId: string
  element: GranblueElement
  maxLevel: number
  rarity: number
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
    xlb: number
  }
  atk: {
    min: number
    max: number
    flb: number
    ulb: number
    xlb: number
  }
  uncap: {
    flb: boolean
    ulb: boolean
    xlb: boolean
  }
}
