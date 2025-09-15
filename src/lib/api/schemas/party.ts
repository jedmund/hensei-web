import { z } from 'zod'
import { snakeToCamel } from './transforms'

// Minimal camelCase validation to start small and safe
const MinimalCamelPartySchema = z
  .object({
    id: z.string(),
    shortcode: z.string(),
    user: z
      .object({ id: z.string().optional() })
      .nullish()
      .optional(),
    localId: z.string().nullish().optional()
  })
  .passthrough()

// NOTE: These old types are deprecated - use types from $lib/types/api/party instead
// Keeping minimal exports for backward compatibility during migration

// Helper for localized names
const LocalizedNameSchema = z.union([
  z.string(),
  z.object({
    en: z.string().nullish(),
    ja: z.string().nullish()
  })
])

// Minimal grid item guards (post camelCase)
const MinimalGridWeaponItemSchema = z
  .object({
    position: z.number(),
    mainhand: z.boolean().nullish().optional(),
    object: z
      .object({
        name: LocalizedNameSchema.nullish().optional()
      })
      .passthrough()
      .nullish()
      .optional()
  })
  .passthrough()

const MinimalGridSummonItemSchema = z
  .object({
    position: z.number(),
    main: z.boolean().nullish().optional(),
    friend: z.boolean().nullish().optional(),
    quickSummon: z.boolean().nullish().optional(),
    object: z
      .object({
        name: LocalizedNameSchema.nullish().optional()
      })
      .passthrough()
      .nullish()
      .optional()
  })
  .passthrough()

const MinimalGridCharacterItemSchema = z
  .object({
    position: z.number(),
    perpetuity: z.boolean().nullish().optional(),
    transcendenceStep: z.number().nullish().optional(),
    object: z
      .object({
        name: LocalizedNameSchema.nullish().optional()
      })
      .passthrough()
      .nullish()
      .optional()
  })
  .passthrough()

const MinimalGridsSchema = z
  .object({
    weapons: z.array(MinimalGridWeaponItemSchema).optional(),
    summons: z.array(MinimalGridSummonItemSchema).optional(),
    characters: z.array(MinimalGridCharacterItemSchema).optional()
  })
  .partial()

// Minimal header associations (raid/job) and core scalar flags/counters
const MinimalHeaderSchema = z
  .object({
    raid: z
      .object({
        name: LocalizedNameSchema.nullish().optional(),
        group: z
          .object({
            difficulty: z.number().nullish().optional(),
            extra: z.boolean().nullish().optional(),
            guidebooks: z.boolean().nullish().optional()
          })
          .passthrough()
          .nullish()
          .optional()
      })
      .passthrough()
      .nullish()
      .optional(),
    job: z
      .object({
        name: LocalizedNameSchema.nullish().optional()
      })
      .passthrough()
      .nullish()
      .optional()
  })
  .partial()

const MinimalScalarsSchema = z
  .object({
    favorited: z.boolean().nullish().optional(),
    fullAuto: z.boolean().nullish().optional(),
    autoGuard: z.boolean().nullish().optional(),
    autoSummon: z.boolean().nullish().optional(),
    chargeAttack: z.boolean().nullish().optional(),
    clearTime: z.number().nullish().optional(),
    buttonCount: z.number().nullish().optional(),
    chainCount: z.number().nullish().optional(),
    turnCount: z.number().nullish().optional(),
    visibility: z.number().nullish().optional()
  })
  .partial()

// User schema
const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: z.number().optional(),
  granblue_id: z.number().nullish(),
  avatar_url: z.string().nullish(),
  crew_name: z.string().nullish()
})

// Raid and RaidGroup schemas
const RaidGroupSchema = z.object({
  id: z.string(),
  name: LocalizedNameSchema,
  difficulty: z.number(),
  section: z.union([z.string(), z.number()]), // Can be number or string
  order: z.number(),
  extra: z.boolean().nullish(),
  guidebooks: z.boolean().nullish()
})

const RaidSchema = z.object({
  id: z.string(),
  name: LocalizedNameSchema,
  slug: z.string().nullish(),
  group: RaidGroupSchema.nullish(),
  element: z.number().nullish()
})

// Job related schemas
const JobSchema = z.object({
  id: z.string(),
  name: LocalizedNameSchema,
  name_jp: z.string().optional(),
  job_type: z.number().nullish(),
  accessory_type: z.number().nullish(),
  proficiency1: z.number().nullish(),
  proficiency2: z.number().nullish(),
  row: z.union([z.string(), z.number()]).nullish(),
  order: z.number().nullish()
})

const JobSkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  name_jp: z.string().optional(),
  slug: z.string(),
  cooldown: z.number().nullish(),
  description: z.string().nullish(),
  description_jp: z.string().nullish(),
  main: z.boolean(),
  sub: z.boolean(),
  emp: z.boolean()
})

const JobAccessorySchema = z.object({
  id: z.string(),
  name: z.string(),
  name_jp: z.string().optional(),
  slug: z.string()
})

// Item schemas
const WeaponSchema = z.object({
  id: z.string(),
  name: z.string(),
  name_jp: z.string().optional(),
  slug: z.string().nullish(),
  granblue_id: z.number().nullish(),
  element: z.number().nullish(),
  proficiency1: z.number().nullish(),
  proficiency2: z.number().nullish(),
  rarity: z.number().nullish(),
  max_level: z.number().nullish(),
  max_skill_level: z.number().nullish(),
  series: z.number().nullish(),
  icon_url: z.string().nullish(),
  square_url: z.string().nullish()
})

const SummonSchema = z.object({
  id: z.string(),
  name: z.string(),
  name_jp: z.string().optional(),
  slug: z.string().nullish(),
  granblue_id: z.number().nullish(),
  element: z.number().nullish(),
  rarity: z.number().nullish(),
  max_level: z.number().nullish(),
  icon_url: z.string().nullish(),
  square_url: z.string().nullish(),
  main: z.boolean().optional(),
  friend: z.boolean().optional(),
  subaura: z.boolean().optional()
})

const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  name_jp: z.string().optional(),
  slug: z.string().nullish(),
  granblue_id: z.number().nullish(),
  element: z.number().nullish(),
  rarity: z.number().nullish(),
  max_level: z.number().nullish(),
  proficiency1: z.number().nullish(),
  proficiency2: z.number().nullish(),
  icon_url: z.string().nullish(),
  square_url: z.string().nullish(),
  special: z.boolean().optional()
})

const GuidebookSchema = z.object({
  id: z.string(),
  name: z.string(),
  name_jp: z.string().optional(),
  slug: z.string(),
  description: z.string().nullish(),
  description_jp: z.string().nullish(),
  granblue_id: z.number(),
  icon_url: z.string().nullish(),
  square_url: z.string().nullish()
})

// Ring/Earring schema for characters
const RingSchema = z.object({
  modifier: z.number().nullish(),
  strength: z.number().nullish()
}).nullish()

// Grid schemas
const GridWeaponSchema = z.object({
  id: z.string(),
  party_id: z.string().nullish(),
  weapon_id: z.string().nullish(),
  position: z.number(),
  mainhand: z.boolean().nullish(),
  uncap_level: z.number().nullish().default(0),
  transcendence_step: z.number().nullish().default(0),
  transcendence_level: z.number().nullish().default(0), // Alias for compatibility
  element: z.number().nullish(),
  
  // Weapon keys
  weapon_key1_id: z.string().nullish(),
  weapon_key2_id: z.string().nullish(),
  weapon_key3_id: z.string().nullish(),
  weapon_key4_id: z.string().nullish(),
  weapon_keys: z.array(z.any()).nullish(), // Populated by API with key details
  
  // Awakening
  awakening_id: z.string().nullish(),
  awakening_level: z.number().nullish().default(1),
  awakening: z.any().nullish(), // Populated by API with awakening details
  
  // AX modifiers
  ax_modifier1: z.number().nullish(),
  ax_strength1: z.number().nullish(),
  ax_modifier2: z.number().nullish(),
  ax_strength2: z.number().nullish(),
  
  // Nested weapon data (populated by API)
  weapon: WeaponSchema.nullish(),
  
  created_at: z.string().nullish(),
  updated_at: z.string().nullish()
})

const GridSummonSchema = z.object({
  id: z.string(),
  party_id: z.string().nullish(),
  summon_id: z.string().nullish(),
  position: z.number(),
  main: z.boolean().nullish(),
  friend: z.boolean().nullish(),
  uncap_level: z.number().nullish().default(0),
  transcendence_step: z.number().nullish().default(0),
  transcendence_level: z.number().nullish().default(0), // Alias for compatibility
  quick_summon: z.boolean().nullish().default(false),
  
  // Nested summon data (populated by API)
  summon: SummonSchema.nullish(),
  
  created_at: z.string().nullish(),
  updated_at: z.string().nullish()
})

const GridCharacterSchema = z.object({
  id: z.string(),
  party_id: z.string().nullish(),
  character_id: z.string().nullish(),
  position: z.number(),
  uncap_level: z.number().nullish().default(0),
  transcendence_step: z.number().nullish().default(0),
  transcendence_level: z.number().nullish().default(0), // Alias for compatibility
  perpetuity: z.boolean().nullish().default(false),
  
  // Rings and earring
  ring1: RingSchema,
  ring2: RingSchema,
  ring3: RingSchema,
  ring4: RingSchema,
  earring: RingSchema,
  
  // Awakening
  awakening_id: z.string().nullish(),
  awakening_level: z.number().nullish().default(1),
  
  // Nested character data (populated by API)
  character: CharacterSchema.nullish(),
  
  // Legacy field
  over_mastery_level: z.number().nullish(),
  
  created_at: z.string().nullish(),
  updated_at: z.string().nullish()
})

// Main Party schema - raw without transform
export const PartySchemaRaw = z.object({
  id: z.string(),
  name: z.string().nullish(),
  description: z.string().nullish(),
  shortcode: z.string(),
  visibility: z.number().nullish().default(1),
  element: z.number().nullish(),
  
  // Battle settings
  full_auto: z.boolean().nullish().default(false),
  auto_guard: z.boolean().nullish().default(false),
  auto_summon: z.boolean().nullish().default(false),
  charge_attack: z.boolean().nullish().default(true),
  
  // Performance metrics
  clear_time: z.number().nullish().default(0),
  button_count: z.number().nullish(),
  turn_count: z.number().nullish(),
  chain_count: z.number().nullish(),
  
  // Relations
  raid_id: z.string().nullish(),
  raid: RaidSchema.nullish(),
  job_id: z.string().nullish(),
  job: JobSchema.nullish(),
  user_id: z.string().nullish(),
  user: UserSchema.nullish(),
  
  // Job details
  master_level: z.number().nullish(),
  ultimate_mastery: z.number().nullish(),
  skill0_id: z.string().nullish(),
  skill1_id: z.string().nullish(),
  skill2_id: z.string().nullish(),
  skill3_id: z.string().nullish(),
  job_skills: z.union([
    z.array(z.any()),
    z.record(z.any())
  ]).nullish().default([]),
  accessory_id: z.string().nullish(),
  accessory: JobAccessorySchema.nullish(),
  
  // Guidebooks
  guidebook1_id: z.string().nullish(),
  guidebook2_id: z.string().nullish(),
  guidebook3_id: z.string().nullish(),
  guidebooks: z.union([
    z.array(z.any()),
    z.record(z.any())
  ]).nullish().default([]),
  
  // Grid arrays (may be empty or contain items with missing nested data)
  characters: z.array(GridCharacterSchema).nullish().default([]),
  weapons: z.array(GridWeaponSchema).nullish().default([]),
  summons: z.array(GridSummonSchema).nullish().default([]),
  
  // Counts
  weapons_count: z.number().nullish().default(0),
  characters_count: z.number().nullish().default(0),
  summons_count: z.number().nullish().default(0),
  
  // Metadata
  extra: z.boolean().nullish().default(false),
  favorited: z.boolean().nullish().default(false),
  remix: z.boolean().nullish().default(false),
  local_id: z.string().nullish(),
  edit_key: z.string().nullish(),
  source_party_id: z.string().nullish(),
  source_party: z.any().nullish(),
  remixes: z.array(z.any()).nullish().default([]),
  
  // Preview
  preview_state: z.number().nullish().default(0),
  preview_generated_at: z.string().nullish(),
  preview_s3_key: z.string().nullish(),
  
  // Timestamps
  created_at: z.string().nullish(),
  updated_at: z.string().nullish()
})

// Apply transform after parsing (do NOT nest this schema inside other schemas)
// Keep exported for typing only; prefer parseParty() for runtime parsing.
export const PartySchema = PartySchemaRaw.transform(snakeToCamel)

// Minimal schema for nested references
export const PartyMinimalSchema = z.object({
  id: z.string(),
  shortcode: z.string(),
  name: z.string().nullish(),
  description: z.string().nullish(),
  user: UserSchema.nullish()
}).transform(snakeToCamel)

// Export types
// Type-level snake_case -> camelCase mapping
type CamelCase<S extends string> = S extends `${infer P}_${infer R}`
  ? `${P}${Capitalize<CamelCase<R>>}`
  : S

type CamelCasedKeysDeep<T> = T extends Array<infer U>
  ? Array<CamelCasedKeysDeep<U>>
  : T extends object
    ? { [K in keyof T as K extends string ? CamelCase<K> : K]: CamelCasedKeysDeep<T[K]> }
    : T

export type Party = CamelCasedKeysDeep<z.infer<typeof PartySchemaRaw>>
export type PartyMinimal = CamelCasedKeysDeep<z.infer<typeof PartyMinimalSchema>>
export type GridWeapon = CamelCasedKeysDeep<z.infer<typeof GridWeaponSchema>>
export type GridSummon = CamelCasedKeysDeep<z.infer<typeof GridSummonSchema>>
export type GridCharacter = CamelCasedKeysDeep<z.infer<typeof GridCharacterSchema>>
export type Weapon = CamelCasedKeysDeep<z.infer<typeof WeaponSchema>>
export type Summon = CamelCasedKeysDeep<z.infer<typeof SummonSchema>>
export type Character = CamelCasedKeysDeep<z.infer<typeof CharacterSchema>>
export type Job = CamelCasedKeysDeep<z.infer<typeof JobSchema>>
export type JobSkill = CamelCasedKeysDeep<z.infer<typeof JobSkillSchema>>
export type JobAccessory = CamelCasedKeysDeep<z.infer<typeof JobAccessorySchema>>
export type Raid = CamelCasedKeysDeep<z.infer<typeof RaidSchema>>
export type RaidGroup = CamelCasedKeysDeep<z.infer<typeof RaidGroupSchema>>
export type User = CamelCasedKeysDeep<z.infer<typeof UserSchema>>
export type Guidebook = CamelCasedKeysDeep<z.infer<typeof GuidebookSchema>>

// Import transformation from client
import { transformResponse } from '../client'
import type { Party as CleanParty } from '$lib/types/api/party'

// Helper: parse raw API party (snake_case) and convert to clean types
export function parseParty(input: unknown): CleanParty {
  // Use the unified transformation from the API client
  // This handles both snake_case → camelCase and object → entity name mapping
  return transformResponse<CleanParty>(input)
}
