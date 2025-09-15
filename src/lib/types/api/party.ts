// Party and Grid types based on Rails blueprints
// These define the party composition structure

import type {
  Weapon,
  Character,
  Summon,
  Job,
  JobSkill,
  JobAccessory,
  Raid,
  Guidebook,
  User,
  Awakening,
  WeaponKey,
  SimpleAxSkill
} from './entities'

// Grid item types - these are the junction tables between Party and entities

// GridWeapon from GridWeaponBlueprint
export interface GridWeapon {
  id: string
  position: number
  mainhand?: boolean
  uncapLevel?: number
  transcendenceStep?: number
  element?: number
  weapon: Weapon  // Named properly, not "object"
  weaponKeys?: WeaponKey[]
  ax?: SimpleAxSkill[]
  awakening?: {
    type: Awakening
    level: number
  }
}

// GridCharacter from GridCharacterBlueprint
export interface GridCharacter {
  id: string
  position: number
  uncapLevel?: number
  perpetuity?: boolean
  transcendenceStep?: number
  character: Character  // Named properly, not "object"
  awakening?: Awakening
  rings?: Array<{ modifier: number; strength: number }>
  earring?: { modifier: number; strength: number }
  aetherial_mastery?: { modifier: number; strength: number }
  over_mastery?: Array<{ modifier: number; strength: number }>
}

// GridSummon from GridSummonBlueprint
export interface GridSummon {
  id: string
  position: number
  main?: boolean
  friend?: boolean
  quickSummon?: boolean
  uncapLevel?: number
  transcendenceStep?: number
  summon: Summon  // Named properly, not "object"
}

// JobSkillList for party job skills
export interface JobSkillList {
  0?: JobSkill
  1?: JobSkill
  2?: JobSkill
  3?: JobSkill
}

// GuidebookList for party guidebooks
export interface GuidebookList {
  0?: Guidebook
  1?: Guidebook
  2?: Guidebook
}

// Party from PartyBlueprint
export interface Party {
  id: string
  shortcode: string
  name?: string
  description?: string
  fullAuto?: boolean
  autoGuard?: boolean
  autoSummon?: boolean
  chargeAttack?: boolean
  clearTime?: number
  buttonCount?: number
  turnCount?: number
  chainCount?: number
  visibility?: number
  favorited?: boolean
  extra?: boolean
  remix?: boolean

  // Relationships
  weapons: GridWeapon[]
  characters: GridCharacter[]
  summons: GridSummon[]
  job?: Job
  jobSkills?: JobSkillList
  accessory?: JobAccessory
  raid?: Raid
  guidebooks?: GuidebookList
  user?: User
  sourceParty?: Party
  remixes?: Party[]

  // Local client state
  localId?: string

  // Timestamps
  createdAt?: string
  updatedAt?: string
}

// Minimal party for list views
export interface PartyPreview {
  id: string
  shortcode: string
  name?: string
  favorited?: boolean
  visibility?: number
  raid?: {
    name: { en: string; ja: string }
    group?: {
      difficulty?: number
      extra?: boolean
      guidebooks?: boolean
    }
  }
  job?: {
    name: { en: string; ja: string }
  }
  weapons: Array<{
    position: number
    mainhand?: boolean
    weapon: {
      granblueId: number
      name?: { en: string; ja: string }
    }
  }>
  characters: Array<{
    position: number
    character: {
      granblueId: number
      name?: { en: string; ja: string }
    }
  }>
  summons: Array<{
    position: number
    main?: boolean
    friend?: boolean
    summon: {
      granblueId: number
      name?: { en: string; ja: string }
    }
  }>
  user?: {
    id: string
    username: string
  }
  createdAt?: string
  updatedAt?: string
}