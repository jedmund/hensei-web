import { z } from 'zod'

export const WeaponEditSchema = z.object({
	name: z
		.union([z.string(), z.object({ en: z.string().optional(), ja: z.string().optional() })])
		.optional(),
	granblue_id: z.string().min(1),
	rarity: z.number().int().min(1),
	element: z.number().int().min(0),
	proficiency1: z.number().int().min(0).optional().default(0),
	proficiency2: z.number().int().min(0).optional().default(0),
	promotions: z.array(z.number().int().min(1)),
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

export type WeaponEdit = z.infer<typeof WeaponEditSchema>

/** Loose shape accepted by toEditData – covers both camelCase and snake_case API responses. */
interface WeaponModel {
	name?: unknown
	granblueId?: string
	granblue_id?: string
	rarity?: number
	element?: number
	proficiency?: number | number[]
	promotions?: number[]
	hp?: {
		minHp?: number
		min_hp?: number
		maxHp?: number
		max_hp?: number
		maxHpFlb?: number
		max_hp_flb?: number
	}
	atk?: {
		minAtk?: number
		min_atk?: number
		maxAtk?: number
		max_atk?: number
		maxAtkFlb?: number
		max_atk_flb?: number
	}
	uncap?: { flb?: boolean; ulb?: boolean; transcendence?: boolean }
}

export function toEditData(model: WeaponModel): WeaponEdit {
	return {
		name: (model?.name as WeaponEdit['name']) ?? '',
		granblue_id: model?.granblueId ?? model?.granblue_id ?? '',
		rarity: model?.rarity ?? 1,
		element: model?.element ?? 0,
		proficiency1: Array.isArray(model?.proficiency)
			? (model.proficiency[0] ?? 0)
			: (model?.proficiency ?? 0),
		proficiency2: Array.isArray(model?.proficiency) ? (model.proficiency[1] ?? 0) : 0,
		promotions: model?.promotions ?? [],
		// API returns camelCase after transformation
		min_hp: model?.hp?.minHp ?? model?.hp?.min_hp ?? 0,
		max_hp: model?.hp?.maxHp ?? model?.hp?.max_hp ?? 0,
		max_hp_flb: model?.hp?.maxHpFlb ?? model?.hp?.max_hp_flb ?? 0,
		min_atk: model?.atk?.minAtk ?? model?.atk?.min_atk ?? 0,
		max_atk: model?.atk?.maxAtk ?? model?.atk?.max_atk ?? 0,
		max_atk_flb: model?.atk?.maxAtkFlb ?? model?.atk?.max_atk_flb ?? 0,
		flb: model?.uncap?.flb ?? false,
		ulb: model?.uncap?.ulb ?? false,
		transcendence: model?.uncap?.transcendence ?? false
	}
}

export function toPayload(edit: WeaponEdit) {
	return {
		name: edit.name,
		granblue_id: edit.granblue_id,
		rarity: edit.rarity,
		element: edit.element,
		proficiency: [edit.proficiency1, edit.proficiency2].filter((v) => v !== 0),
		promotions: edit.promotions,
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
