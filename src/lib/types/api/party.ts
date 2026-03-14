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
  WeaponKey
} from './entities'
import type { GridArtifact, CollectionArtifact } from './artifact'
import type { AugmentSkill, Befoulment } from './weaponStatModifier'
import type { CollectionCharacter, CollectionWeapon, CollectionSummon } from './collection'
import type { PartyShare } from './partyShare'

/** Embedded collection data for a single user, scoped to the party's items */
export interface PartyCollection {
  characters: CollectionCharacter[]
  weapons: CollectionWeapon[]
  summons: CollectionSummon[]
}

// Minimal party stub embedded in grid item responses (from :collection_source view)
export interface PartyCollectionSource {
	collectionSourceUserId?: string
	collectionSourceUser?: User
}

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
  /** AX skills with full modifier objects */
  ax?: AugmentSkill[]
  /** Befoulment for Odiant weapons */
  befoulment?: Befoulment
  awakening?: {
    type?: Awakening
    level?: number
  }
  /** Reference to the source collection weapon if linked */
  collectionWeaponId?: string
  /** Whether the grid item is out of sync with its collection source */
  outOfSync?: boolean
  /** Whether the linked collection item has been deleted (item is orphaned) */
  orphaned?: boolean
  /** Embedded party stub from :full view (collection source fields only) */
  party?: PartyCollectionSource
}

// GridCharacter from GridCharacterBlueprint
export interface GridCharacter {
  id: string
  position: number
  uncapLevel?: number
  perpetuity?: boolean
  transcendenceStep?: number
  character: Character  // Named properly, not "object"
  awakening?: {
    type?: Awakening
    level?: number
  }
  aetherialMastery?: { modifier: number; strength: number }
  overMastery?: Array<{ modifier: number; strength: number }>
  /** Equipped artifact (can be grid or collection artifact) */
  artifact?: GridArtifact | CollectionArtifact
  /** Reference to the source collection character if linked */
  collectionCharacterId?: string
  /** Whether the grid item is out of sync with its collection source */
  outOfSync?: boolean
  /** Whether the linked collection item has been deleted (item is orphaned) */
  orphaned?: boolean
  /** Embedded party stub from :full view (collection source fields only) */
  party?: PartyCollectionSource
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
  /** Reference to the source collection summon if linked */
  collectionSummonId?: string
  /** Whether the grid item is out of sync with its collection source */
  outOfSync?: boolean
  /** Whether the linked collection item has been deleted (item is orphaned) */
  orphaned?: boolean
  /** Embedded party stub from :full view (collection source fields only) */
  party?: PartyCollectionSource
}

// JobSkillList for party job skills
export interface JobSkillList {
  0?: JobSkill
  1?: JobSkill
  2?: JobSkill
  3?: JobSkill
}

// GuidebookList for party guidebooks (1-based keys matching API response)
export interface GuidebookList {
  1?: Guidebook
  2?: Guidebook
  3?: Guidebook
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
  summonCount?: number
  videoUrl?: string
  visibility?: import('$lib/types/visibility').PartyVisibility
  element?: number
  favorited?: boolean
  extra?: boolean
  remix?: boolean
  editKey?: string
  /** Boost mod (omega, primal, odious, unboosted) and side (double, single, none) */
  boost?: { mod: string | null; side: string | null }
  /** Whether the party contains any orphaned grid items */
  hasOrphanedItems?: boolean
  /** The user whose collection is linked to this party (null if no collection items) */
  collectionSourceUserId?: string
  /** The user object for collectionSourceUserId (resolved by API when present) */
  collectionSourceUser?: User

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
  /** Shares for this party (only present for owner) */
  shares?: PartyShare[]
  /** Collection items for the viewing user, scoped to this party's items */
  viewerCollection?: PartyCollection
  /** Collection items for the collection source user, scoped to this party's items */
  sourceCollection?: PartyCollection

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
  boost?: { mod: string | null; side: string | null }
  visibility?: import('$lib/types/visibility').PartyVisibility
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