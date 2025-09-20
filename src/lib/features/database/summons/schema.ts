import { z } from 'zod'

export const SummonEditSchema = z.object({
  name: z.union([z.string(), z.object({ en: z.string().optional(), ja: z.string().optional() })]).optional(),
  granblue_id: z.string().min(1),
  rarity: z.number().int().min(1),
  element: z.number().int().min(0),
  min_hp: z.number().int().min(0),
  max_hp: z.number().int().min(0),
  max_hp_flb: z.number().int().min(0),
  min_atk: z.number().int().min(0),
  max_atk: z.number().int().min(0),
  max_atk_flb: z.number().int().min(0),
  flb: z.boolean(),
  ulb: z.boolean(),
  transcendence: z.boolean()
})

export type SummonEdit = z.infer<typeof SummonEditSchema>

export function toEditData(model: any): SummonEdit {
  return {
    name: model?.name ?? '',
    granblue_id: model?.granblue_id ?? '',
    rarity: model?.rarity ?? 1,
    element: model?.element ?? 0,
    min_hp: model?.hp?.min_hp ?? 0,
    max_hp: model?.hp?.max_hp ?? 0,
    max_hp_flb: model?.hp?.max_hp_flb ?? 0,
    min_atk: model?.atk?.min_atk ?? 0,
    max_atk: model?.atk?.max_atk ?? 0,
    max_atk_flb: model?.atk?.max_atk_flb ?? 0,
    flb: model?.uncap?.flb ?? false,
    ulb: model?.uncap?.ulb ?? false,
    transcendence: model?.uncap?.transcendence ?? false
  }
}

export function toPayload(edit: SummonEdit) {
  return {
    name: edit.name,
    granblue_id: edit.granblue_id,
    rarity: edit.rarity,
    element: edit.element,
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
    }
  }
}

