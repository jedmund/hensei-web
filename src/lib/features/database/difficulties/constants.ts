import * as m from '$lib/paraglide/messages'

export type DifficultyComponentValue = 'weapon' | 'character' | 'summon' | 'job' | 'accessory'

export interface DifficultyComponentOption {
	value: DifficultyComponentValue
	label: string
}

/**
 * Component types that rules and components map to. The same five appear
 * in the RuleModal type picker and the rules-tab filter chips.
 */
export function getDifficultyComponentOptions(): DifficultyComponentOption[] {
	return [
		{ value: 'weapon', label: m.filter_cat_weapon() },
		{ value: 'character', label: m.filter_cat_character() },
		{ value: 'summon', label: m.filter_cat_summon() },
		{ value: 'job', label: m.difficulty_component_job() },
		{ value: 'accessory', label: m.difficulty_component_accessory() }
	]
}
