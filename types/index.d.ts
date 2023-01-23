export type SearchableObject = Character | Weapon | Summon | JobSkill
export type SearchableObjectArray = (Character | Weapon | Summon | JobSkill)[]
export type JobSkillObject = {
  [key: number]: JobSkill | undefined
  0: JobSkill | undefined
  1: JobSkill | undefined
  2: JobSkill | undefined
  3: JobSkill | undefined
}

export type FilterObject = {
  raid?: string
  element?: number
  recency?: number
}

export type PaginationObject = {
  count: number
  totalPages: number
  perPage: number
}

export type DetailsObject = {
  [key: string]: boolean | number | string | Raid | undefined
  fullAuto?: boolean
  autoGuard?: boolean
  chargeAttack?: boolean
  clearTime?: number
  buttonCount?: number
  turnCount?: number
  chainCount?: number
  name?: string
  description?: string
  raid?: Raid
  job?: Job
  extra?: boolean
}

export type ExtendedMastery = {
  modifier?: number
  strength?: number
}

export type CharacterOverMastery = {
  [key: number]: ExtendedMastery
  1: ExtendedMastery
  2: ExtendedMastery
  3: ExtendedMastery
  4: ExtendedMastery
}
