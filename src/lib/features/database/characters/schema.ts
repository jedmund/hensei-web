import { z } from 'zod'
import { normalizeCharacterUncap } from '$lib/utils/uncap'

// Edit-state schema used on the client and for form validation server-side
export const CharacterEditSchema = z
	.object({
		name: z
			.union([z.string(), z.object({ en: z.string().optional(), ja: z.string().optional() })])
			.optional(),
		granblue_id: z.string().min(1),
		rarity: z.number().int().min(1),
		element: z.number().int().min(0),
		race1: z.number().int().nullable().optional(),
		race2: z.number().int().nullable().optional(),
		gender: z.number().int().min(0),
		proficiency1: z.number().int().min(0),
		proficiency2: z.number().int().min(0),
		season: z.number().int().min(1).nullable(),
		series: z.array(z.number().int().min(1)),
		gacha_available: z.boolean(),
		min_hp: z.number().int().min(0),
		max_hp: z.number().int().min(0),
		max_hp_flb: z.number().int().min(0),
		max_hp_ulb: z.number().int().min(0),
		max_hp_transcendence: z.number().int().min(0),
		min_atk: z.number().int().min(0),
		max_atk: z.number().int().min(0),
		max_atk_flb: z.number().int().min(0),
		max_atk_ulb: z.number().int().min(0),
		max_atk_transcendence: z.number().int().min(0),
		flb: z.boolean(),
		ulb: z.boolean(),
		transcendence: z.boolean(),
		max_transcendence_stage: z.number().int().min(0).max(5),
		special: z.boolean(),
		style_swap: z.boolean(),
		gender_variants: z.boolean(),
		style_name_en: z.string().nullable(),
		style_name_jp: z.string().nullable()
	})
	.superRefine((data, ctx) => {
		if (data.transcendence && data.max_transcendence_stage === 0) {
			ctx.addIssue({
				code: 'custom',
				path: ['max_transcendence_stage'],
				message: 'Select the highest released transcendence stage'
			})
		}
		if (data.special && data.transcendence) {
			ctx.addIssue({
				code: 'custom',
				path: ['transcendence'],
				message: 'Special characters use ULB'
			})
		}
		if (data.ulb && (!data.special || !data.flb)) {
			ctx.addIssue({
				code: 'custom',
				path: ['ulb'],
				message: 'ULB requires a special character with FLB'
			})
		}
	})

export type CharacterEdit = z.infer<typeof CharacterEditSchema>

/** Loose shape accepted by toEditData – covers both camelCase and snake_case API responses. */
interface CharacterModel {
	name?: unknown
	granblueId?: string
	granblue_id?: string
	rarity?: number
	element?: number
	race?: (number | null)[]
	gender?: number
	proficiency?: number[]
	season?: number | null
	series?: number[]
	gachaAvailable?: boolean
	gacha_available?: boolean
	hp?: {
		minHp?: number
		min_hp?: number
		maxHp?: number
		max_hp?: number
		maxHpFlb?: number
		max_hp_flb?: number
		maxHpUlb?: number
		max_hp_ulb?: number
		maxHpTranscendence?: number
		max_hp_transcendence?: number
	}
	atk?: {
		minAtk?: number
		min_atk?: number
		maxAtk?: number
		max_atk?: number
		maxAtkFlb?: number
		max_atk_flb?: number
		maxAtkUlb?: number
		max_atk_ulb?: number
		maxAtkTranscendence?: number
		max_atk_transcendence?: number
	}
	uncap?: {
		flb?: boolean
		ulb?: boolean
		transcendence?: boolean
		maxTranscendenceStage?: number
		max_transcendence_stage?: number
	}
	special?: boolean
	styleSwap?: boolean
	style_swap?: boolean
	genderVariants?: boolean
	gender_variants?: boolean
	styleName?: { en?: string; ja?: string }
	style_name_en?: string | null
	style_name_jp?: string | null
}

export function toEditData(model: CharacterModel): CharacterEdit {
	const special = model?.special ?? false
	const uncap = normalizeCharacterUncap({
		special,
		uncap: {
			flb: model?.uncap?.flb ?? false,
			ulb: model?.uncap?.ulb,
			transcendence: model?.uncap?.transcendence,
			maxTranscendenceStage:
				model?.uncap?.maxTranscendenceStage ?? model?.uncap?.max_transcendence_stage
		}
	})

	return {
		name: (model?.name as CharacterEdit['name']) ?? '',
		granblue_id: model?.granblueId ?? model?.granblue_id ?? '',
		rarity: model?.rarity ?? 1,
		element: model?.element ?? 0,
		race1: model?.race?.[0] ?? null,
		race2: model?.race?.[1] ?? null,
		gender: model?.gender ?? 0,
		proficiency1: model?.proficiency?.[0] ?? 0,
		proficiency2: model?.proficiency?.[1] ?? 0,
		season: model?.season ?? null,
		series: model?.series ?? [],
		// API returns camelCase (gachaAvailable) after transformation
		gacha_available: model?.gachaAvailable ?? model?.gacha_available ?? true,
		min_hp: model?.hp?.minHp ?? model?.hp?.min_hp ?? 0,
		max_hp: model?.hp?.maxHp ?? model?.hp?.max_hp ?? 0,
		max_hp_flb: model?.hp?.maxHpFlb ?? model?.hp?.max_hp_flb ?? 0,
		max_hp_ulb: model?.hp?.maxHpUlb ?? model?.hp?.max_hp_ulb ?? 0,
		max_hp_transcendence: model?.hp?.maxHpTranscendence ?? model?.hp?.max_hp_transcendence ?? 0,
		min_atk: model?.atk?.minAtk ?? model?.atk?.min_atk ?? 0,
		max_atk: model?.atk?.maxAtk ?? model?.atk?.max_atk ?? 0,
		max_atk_flb: model?.atk?.maxAtkFlb ?? model?.atk?.max_atk_flb ?? 0,
		max_atk_ulb: model?.atk?.maxAtkUlb ?? model?.atk?.max_atk_ulb ?? 0,
		max_atk_transcendence:
			model?.atk?.maxAtkTranscendence ?? model?.atk?.max_atk_transcendence ?? 0,
		flb: uncap.flb,
		ulb: uncap.ulb,
		transcendence: uncap.transcendence,
		max_transcendence_stage: uncap.maxTranscendenceStage,
		special,
		style_swap: model?.styleSwap ?? model?.style_swap ?? false,
		gender_variants: model?.genderVariants ?? model?.gender_variants ?? false,
		style_name_en: model?.styleName?.en ?? model?.style_name_en ?? null,
		style_name_jp: model?.styleName?.ja ?? model?.style_name_jp ?? null
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
		season: edit.season,
		series: edit.series,
		gacha_available: edit.gacha_available,
		hp: {
			min_hp: edit.min_hp,
			max_hp: edit.max_hp,
			max_hp_flb: edit.max_hp_flb,
			max_hp_ulb: edit.max_hp_ulb,
			max_hp_transcendence: edit.max_hp_transcendence
		},
		atk: {
			min_atk: edit.min_atk,
			max_atk: edit.max_atk,
			max_atk_flb: edit.max_atk_flb,
			max_atk_ulb: edit.max_atk_ulb,
			max_atk_transcendence: edit.max_atk_transcendence
		},
		uncap: {
			flb: edit.flb,
			ulb: edit.ulb,
			transcendence: edit.transcendence,
			max_transcendence_stage: edit.transcendence ? edit.max_transcendence_stage : 0
		},
		special: edit.special,
		style_swap: edit.style_swap,
		gender_variants: edit.gender_variants,
		style_name_en: edit.style_name_en,
		style_name_jp: edit.style_name_jp
	}
}
