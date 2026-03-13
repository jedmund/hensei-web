// Core entity types based on Rails blueprints
// These are the base types for game objects

import type { WeaponSeriesRef } from './weaponSeries'
import type { CharacterSeriesRef } from './characterSeries'

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
  maxExorcismLevel?: number | null
  /** Weapon series - object with slug/name/flags */
  series: WeaponSeriesRef | null
  ax: boolean
  axType: number
  limit?: number
  extra?: boolean
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
    extraPrerequisite?: number | null
  }
  transcendenceHp?: number
  transcendenceAtk?: number
  // Available awakenings for this weapon (from :full view)
  awakenings?: Awakening[]
  // Database/admin fields
  releaseDate?: string
  flbDate?: string
  ulbDate?: string
  transcendenceDate?: string
  wiki?: { en?: string; ja?: string }
  gamewith?: string
  kamigame?: string
  nicknames?: { en?: string[]; ja?: string[] }
  recruits?: string | { id: string; granblueId: string; name: LocalizedName }
  // Forge chain fields
  forgeOrder?: number | null
  forgedFrom?: { id: string; granblueId: string; name: LocalizedName } | null
  forgeChain?: Array<{ id: string; granblueId: string; name: LocalizedName; forgeOrder: number }> | null
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
  hp?: {
    minHp?: number
    maxHp?: number
    maxHpFlb?: number
    maxHpUlb?: number
  }
  atk?: {
    minAtk?: number
    maxAtk?: number
    maxAtkFlb?: number
    maxAtkUlb?: number
  }
  // Other stats
  baseDa?: number
  baseTa?: number
  ougiRatio?: {
    ougiRatio?: number
    ougiRatioFlb?: number
  }
  // Available awakenings for this character (from :full view)
  awakenings?: Awakening[]
  // Database/admin fields
  characterId?: number[]
  season?: number
  series?: number[] | CharacterSeriesRef[]
  /** Human-readable series names (computed by API) */
  seriesNames?: string[]
  releaseDate?: string
  flbDate?: string
  ulbDate?: string
  wiki?: { en?: string; ja?: string }
  gamewith?: string
  kamigame?: string
  nicknames?: { en?: string[]; ja?: string[] }
  recruitedBy?: { id: string; granblueId: string; name: LocalizedName; promotionNames?: string[] }
  // Style swap fields
  styleSwap: boolean
  styleName?: LocalizedName | null
  baseCharacter?: { id: string; granblueId: string; name: LocalizedName } | null
  styleSwaps?: Array<{ id: string; granblueId: string; name: LocalizedName; styleName: LocalizedName | null }>
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
  transcendenceHp?: number
  transcendenceAtk?: number
  series?: number
  // Database/admin fields
  releaseDate?: string
  flbDate?: string
  ulbDate?: string
  transcendenceDate?: string
  wiki?: { en?: string; ja?: string }
  gamewith?: string
  kamigame?: string
  nicknames?: { en?: string[]; ja?: string[] }
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
  auxWeapon?: boolean      // Whether this job requires an aux weapon in the first non-mainhand slot
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
  imageId?: string    // Image filename (e.g., "2710_3")
  actionId?: number   // Unique game ID
}

// JobAccessory entity from JobAccessoryBlueprint
export interface JobAccessory {
  id: string
  name: LocalizedName
  granblueId: string
  rarity: number
  releaseDate?: string
  accessoryType: number  // 1 = Shield, 2 = Manatura
  job?: Job              // Associated job (optional, included when available)
}

// Raid entity from RaidBlueprint
// Properties are camelCase because BaseAdapter transforms snake_case responses
export interface Raid {
  id: string
  slug: string
  name: LocalizedName
  level: number
  element: number
  extra: boolean
  playerCount?: number
  enemyId?: number
  summonId?: number
  questId?: number
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
  unlimited: boolean
}

// Awakening entity
export interface Awakening {
  id: string
  name: LocalizedName
  slug: string
  objectType?: string
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

// Guidebook entity
export interface Guidebook {
  id: string
  granblueId: number
  name: LocalizedName
  description?: LocalizedName
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
