/**
 * Raid and RaidGroup types
 *
 * Re-exports base types from entities.ts and adds input types for CRUD operations.
 */

import type { LocalizedName } from './entities'

// Re-export from entities
export type { Raid, RaidGroup } from './entities'

// Extended Raid type (from :full view)
export interface RaidFull {
  id: string
  slug: string
  name: LocalizedName
  level: number
  element: number
  enemy_id?: number
  summon_id?: number
  quest_id?: number
  group?: RaidGroupFlat
}

// Flat RaidGroup (from :flat view, used in nested Raid responses)
export interface RaidGroupFlat {
  id: string
  name: LocalizedName
  section: number | string
  order: number
  difficulty: number
  hl: boolean
  extra: boolean
  guidebooks: boolean
  unlimited: boolean
}

// Full RaidGroup (from :full view, includes raids)
export interface RaidGroupFull extends RaidGroupFlat {
  raids: RaidFull[]
}

// Input types for creating/updating raids
export interface CreateRaidInput {
  name_en: string
  name_jp: string
  slug: string
  level?: number
  element: number
  group_id: string
  enemy_id?: number
  summon_id?: number
  quest_id?: number
}

export interface UpdateRaidInput {
  name_en?: string
  name_jp?: string
  slug?: string
  level?: number
  element?: number
  group_id?: string
  enemy_id?: number
  summon_id?: number
  quest_id?: number
}

// Input types for creating/updating raid groups
export interface CreateRaidGroupInput {
  name_en: string
  name_jp: string
  section: number
  order: number
  difficulty: number
  hl: boolean
  extra: boolean
  guidebooks: boolean
  unlimited: boolean
}

export interface UpdateRaidGroupInput {
  name_en?: string
  name_jp?: string
  section?: number
  order?: number
  difficulty?: number
  hl?: boolean
  extra?: boolean
  guidebooks?: boolean
  unlimited?: boolean
}

// Filter types for raid queries
export interface RaidFilters {
  element?: number
  groupId?: string
  difficulty?: number
  hl?: boolean
  extra?: boolean
  guidebooks?: boolean
  unlimited?: boolean
}
