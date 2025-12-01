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
  // Available awakenings for this weapon (from :full view)
  awakenings?: Awakening[]
}

// Character entity from CharacterBlueprint
export interface Character {
  id: string
  granblueId: string
  name: LocalizedName
  element: number
  rarity: number
  maxLevel: number
  maxAwakeningLevel?: number
  uncap: {
    flb: boolean
    ulb: boolean
    transcendence?: boolean
  }
  special: boolean
  recruits: string | null
  gender: number
  race: {
    race1: number
    race2: number
  }
  proficiency: number[]
  hp: {
    minHp: number
    maxHp: number
    maxHpFlb: number
  }
  atk: {
    minAtk: number
    maxAtk: number
    maxAtkFlb: number
  }
  // Available awakenings for this character (from :full view)
  awakenings?: Awakening[]
}

// Summon entity from SummonBlueprint
export interface Summon {
  id: string
  granblueId: string
  name: LocalizedName
  element: number
  rarity: number
  maxLevel: number
  uncap: {
    flb: boolean
    ulb: boolean
    transcendence: boolean
  }
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

// Raw data response from separate /raw endpoint
export interface EntityRawData {
  wikiRaw: string | null
  gameRawEn: Record<string, unknown> | null
  gameRawJp: Record<string, unknown> | null
}

// Job entity from JobBlueprint
export interface Job {
  id: string
  granblueId: string
  name: LocalizedName
  row: number
  order: number
  proficiency: [number, number]
  masterLevel?: boolean    // Whether this job supports master level
  ultimateMastery?: boolean // Whether this job supports ultimate mastery
  accessory?: boolean
  accessoryType?: number
}

// JobSkill entity from JobSkillBlueprint
export interface JobSkill {
  id: string
  name: LocalizedName
  slug: string
  color: number       // Skill category (0-3 for colors, relates to skill type)
  main: boolean       // Primary job skill
  sub: boolean        // Sub-skill (transferable)
  emp: boolean        // EMP skill
  base: boolean       // Base skill (for advanced jobs)
  order: number       // Display order
  job: Job            // Associated job
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
  order?: number
}

// No awakening constant
export const NO_AWAKENING: Awakening = {
  id: '0',
  name: { en: 'No awakening', ja: '覚醒なし' },
  slug: 'no-awakening',
  order: 0
}

// WeaponKey entity
export interface WeaponKey {
  id: string
  granblue_id: number
  name: LocalizedName
  slug: string
  series: number[]
  slot: number
  group: number
  order: number
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
  avatar?: {
    picture?: string
    element?: string
  }
}
