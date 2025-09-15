// Core entity types based on Rails blueprints
// These are the base types for game objects

export interface LocalizedName {
  en: string
  ja: string
}

// Weapon entity from WeaponBlueprint
export interface Weapon {
  id: string
  granblueId: string
  name: LocalizedName
  element: number
  proficiency: number
  rarity: number
  maxLevel: number
  maxSkillLevel: number
  maxAwakeningLevel: number
  series: number
  ax: boolean
  axType: number
  hp: {
    minHp: number
    maxHp: number
    maxHpFlb: number
    maxHpUlb: number
  }
  atk: {
    minAtk: number
    maxAtk: number
    maxAtkFlb: number
    maxAtkUlb: number
  }
  uncap: {
    flb: boolean
    ulb: boolean
    transcendence: boolean
  }
}

// Character entity from CharacterBlueprint
export interface Character {
  id: string
  granblueId: string
  name: LocalizedName
  element: number
  rarity: number
  maxLevel: number
  flb: boolean
  ulb: boolean
  transcendence: boolean
  special: boolean
  recruits: string | null
}

// Summon entity from SummonBlueprint
export interface Summon {
  id: string
  granblueId: string
  name: LocalizedName
  element: number
  rarity: number
  maxLevel: number
  flb: boolean
  ulb: boolean
  transcendence: boolean
  subaura: boolean
  hp: {
    minHp: number
    maxHp: number
    maxHpFlb: number
    maxHpUlb: number
  }
  atk: {
    minAtk: number
    maxAtk: number
    maxAtkFlb: number
    maxAtkUlb: number
  }
}

// Job entity from JobBlueprint
export interface Job {
  id: string
  granblueId: string
  name: LocalizedName
  row: number
  order: number
  proficiency: [number, number]
  masterLevel?: number
  ultimateMastery?: number
  accessory?: boolean
  accessoryType?: number
}

// JobSkill entity
export interface JobSkill {
  id: string
  name: LocalizedName
  slug: string
  category: number
  main: boolean
  sub: boolean
}

// JobAccessory entity
export interface JobAccessory {
  id: string
  name: LocalizedName
  slug: string
  granblueId: string
}

// Raid entity from RaidBlueprint
export interface Raid {
  id: string
  slug: string
  name: LocalizedName
  level: number
  element: number
  group?: RaidGroup
}

// RaidGroup entity from RaidGroupBlueprint
export interface RaidGroup {
  id: string
  name: LocalizedName
  section: string
  order: number
  difficulty: number
  hl: boolean
  extra: boolean
  guidebooks: boolean
}

// Awakening entity
export interface Awakening {
  id: string
  name: LocalizedName
  slug: string
}

// WeaponKey entity
export interface WeaponKey {
  id: string
  name: LocalizedName
  slug: string
  keyType: string
  slot: number
}

// SimpleAxSkill for weapon AX skills
export interface SimpleAxSkill {
  modifier: number
  strength: number
}

// Guidebook entity
export interface Guidebook {
  id: string
  name: LocalizedName
  slug: string
}

// User entity
export interface User {
  id: string
  username: string
  profilePicture?: string
  role?: string
  createdAt?: string
  updatedAt?: string
}