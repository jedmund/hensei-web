interface Character {
  type: 'character'

  id: string
  granblue_id: string
  character_id: readonly number[]
  element: number
  rarity: number
  gender: number
  max_level: number
  name: {
    [key: string]: string
    en: string
    ja: string
  }
  hp: {
    min_hp: number
    max_hp: number
    max_hp_flb: number
  }
  atk: {
    min_atk: number
    max_atk: number
    max_atk_flb: number
  }
  uncap: {
    flb: boolean
    ulb: boolean
  }
  race: {
    race1: number
    race2: number
  }
  proficiency: {
    proficiency1: number
    proficiency2: number
  }
  position?: number
  special: boolean
}
