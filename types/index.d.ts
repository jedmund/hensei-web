export type SearchableObject =
  | Character
  | Weapon
  | Summon
  | JobSkill
  | Guidebook
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
  [key: string]: boolean | number | string | string[] | Raid | undefined
  fullAuto?: boolean
  autoGuard?: boolean
  autoSummon?: boolean
  chargeAttack?: boolean
  clearTime?: number
  buttonCount?: number
  turnCount?: number
  chainCount?: number
  name?: string
  description?: string
  raid?: Raid
  job?: Job
  guidebooks?: string[]
  visibility?: number
}

export type ExtendedMastery = {
  modifier?: number
  strength?: number
}

export type CharacterOverMastery = ExtendedMastery[]

export interface MasteryBonuses {
  awakening?: {
    type: Awakening
    level: number
  }
  over_mastery?: CharacterOverMastery
  aetherial_mastery?: ExtendedMastery
}

export interface GridCharacterObject {
  character: {
    rings: ExtendedMastery[]
    earring: ExtendedMastery
    awakening?: {
      id: string
      level: number
    }
    transcendence_step: number
    perpetuity: boolean
  }
}

interface GridWeaponObject {
  weapon: {
    element?: number
    weapon_key1_id?: string
    weapon_key2_id?: string
    weapon_key3_id?: string
    ax_modifier1?: number
    ax_modifier2?: number
    ax_strength1?: number
    ax_strength2?: number
    awakening_id?: string
    awakening_level?: Number
  }
}

interface PerpetuityObject {
  character: {
    perpetuity: boolean
  }
}

interface PageContextObj {
  user?: User
  teams?: Party[]
  party?: Party
  jobs?: Job[]
  jobSkills?: JobSkill[]
  raidGroups: RaidGroup[]
  weaponKeys?: GroupedWeaponKeys
  pagination?: PaginationObject
  meta?: { [key: string]: string }
}

interface ResponseStatus {
  code: number
  text: string
}
