/** Localized labels for guidebook enums. */

import * as m from '$lib/paraglide/messages'
import type { GuideEffectRarity } from '$lib/types/api/solomonis'
import type { GuideEffectIconCategory, GuideEffectTargetFilter } from './guidebook'

export function rarityLabel(rarity: GuideEffectRarity): string {
	switch (rarity) {
		case 'unique':
			return m.solomonis_web_guidebook_rarity_unique()
		case 'rare':
			return m.solomonis_web_guidebook_rarity_rare()
		case 'normal':
			return m.solomonis_web_guidebook_rarity_normal()
		case 'cursed':
			return m.solomonis_web_guidebook_rarity_cursed()
	}
}

export function iconCategoryLabel(category: GuideEffectIconCategory): string {
	switch (category) {
		case 'offence':
			return m.solomonis_web_guidebook_icon_offence()
		case 'defence':
			return m.solomonis_web_guidebook_icon_defence()
		case 'special':
			return m.solomonis_web_guidebook_icon_special()
		case 'cursed':
			return m.solomonis_web_guidebook_icon_cursed()
	}
}

export function targetLabel(target: GuideEffectTargetFilter): string {
	switch (target) {
		case 'all':
			return m.solomonis_web_guidebook_filter_all()
		case 'everyone':
			return m.solomonis_web_guidebook_target_everyone()
		case 'race':
			return m.solomonis_web_guidebook_target_race()
		case 'proficiency':
			return m.solomonis_web_guidebook_target_proficiency()
		case 'character':
			return m.solomonis_web_guidebook_target_character()
	}
}
