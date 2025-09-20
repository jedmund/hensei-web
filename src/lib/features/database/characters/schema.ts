import { z } from 'zod'

// Edit-state schema used on the client and for form validation server-side
export const CharacterEditSchema = z.object({
  name: z.union([z.string(), z.object({ en: z.string().optional(), ja: z.string().optional() })]).optional(),
  granblue_id: z.string().min(1),
  rarity: z.number().int().min(1),
  element: z.number().int().min(0),
  race1: z.number().int().nullable().optional(),
  race2: z.number().int().nullable().optional(),
  gender: z.number().int().min(0),
  proficiency1: z.number().int().min(0),
  proficiency2: z.number().int().min(0),
  min_hp: z.number().int().min(0),
  max_hp: z.number().int().min(0),
  max_hp_flb: z.number().int().min(0),
  min_atk: z.number().int().min(0),
  max_atk: z.number().int().min(0),
  max_atk_flb: z.number().int().min(0),
  flb: z.boolean(),
  ulb: z.boolean(),
  transcendence: z.boolean(),
  special: z.boolean()
})

export type CharacterEdit = z.infer<typeof CharacterEditSchema>

export function toEditData(model: any): CharacterEdit {
  return {
    name: model?.name ?? '',
    granblue_id: model?.granblue_id ?? '',
    rarity: model?.rarity ?? 1,
    element: model?.element ?? 0,
    race1: model?.race?.[0] ?? null,
    race2: model?.race?.[1] ?? null,
    gender: model?.gender ?? 0,
    proficiency1: model?.proficiency?.[0] ?? 0,
    proficiency2: model?.proficiency?.[1] ?? 0,
    min_hp: model?.hp?.min_hp ?? 0,
    max_hp: model?.hp?.max_hp ?? 0,
    max_hp_flb: model?.hp?.max_hp_flb ?? 0,
    min_atk: model?.atk?.min_atk ?? 0,
    max_atk: model?.atk?.max_atk ?? 0,
    max_atk_flb: model?.atk?.max_atk_flb ?? 0,
    flb: model?.uncap?.flb ?? false,
    ulb: model?.uncap?.ulb ?? false,
    transcendence: model?.uncap?.transcendence ?? false,
    special: model?.special ?? false
  }
}

// Payload mapping to backend API
export function toPayload(edit: CharacterEdit) {
  return {
    name: edit.name,
    granblue_id: edit.granblue_id,
    rarity: edit.rarity,
    element: edit.element,
    race: [edit.race1, edit.race2].filter((r) => r !== null && r !== undefined),
    gender: edit.gender,
    proficiency: [edit.proficiency1, edit.proficiency2],
    hp: {
      min_hp: edit.min_hp,
      max_hp: edit.max_hp,
      max_hp_flb: edit.max_hp_flb
    },
    atk: {
      min_atk: edit.min_atk,
      max_atk: edit.max_atk,
      max_atk_flb: edit.max_atk_flb
    },
    uncap: {
      flb: edit.flb,
      ulb: edit.ulb,
      transcendence: edit.transcendence
    },
    special: edit.special
  }
}

