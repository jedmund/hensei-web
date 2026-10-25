/**
 * Parameters for the game's two draw scenes, built from a draw and its
 * presentation. Scene 1 plays the opening crystal, the transition and the
 * stones; scene 2 reveals each item. The names and value codes are the
 * game's own (see the animation harness's driver).
 */

import type { Moon } from './moons'
import type { Presentation, Rarity } from './presentation'
import type { CatalogueItem } from '$lib/types/gacha'

/** The game's rarity codes */
const RARE: Record<Rarity, number> = { R: 2, SR: 3, SSR: 4 }
/** Class-up codes: the rarity a stone classes up to */
const CLASSUP: Record<Rarity, number> = { R: 0, SR: 1, SSR: 2 }

export type SceneParams = Record<string, unknown>

function common(items: CatalogueItem[], presentation: Presentation) {
	const { pattern, stones } = presentation
	return {
		cjs_gacha_num: items.length,
		is_lupi_gacha: false,
		gacha_rare_array: stones.map((stone) => RARE[stone.rarity]),
		gacha_rare_classup_array: stones.map((stone) =>
			stone.startsAs === stone.rarity ? 0 : CLASSUP[stone.rarity]
		),
		main_pattern: pattern.main,
		sub_pattern: pattern.sub,
		add_pattern: pattern.add
	}
}

export function scene1Params(items: CatalogueItem[], presentation: Presentation): SceneParams {
	return {
		...common(items, presentation),
		gacha_quality_array: items.map(() => 0)
	}
}

/**
 * @param names - each item's name in the page's language
 * @param moons - the moon each item gives, shown on its card
 * @param skippedScene1 - whether scene 1 ended on its skip button
 */
export function scene2Params(
	items: CatalogueItem[],
	presentation: Presentation,
	names: string[],
	moons: Moon[],
	skippedScene1: boolean
): SceneParams {
	return {
		...common(items, presentation),
		// The "joined your party" scenes need the viewer's collection; not yet
		cjs_gacha_demo_num: 0,
		cjs_gacha_demo_pickup_num: 0,
		gacha_pickup_demo_array: items.map(() => 0),
		gacha_npc_id: [],
		gacha_npc_text: [],
		gacha_npc_cutin_voice: items.map(() => ''),
		gacha_voice_wait_time_array: items.map(() => 0),
		gacha_type_array: items.map((item) => (item.drawable_type === 'Summon' ? 2 : 1)),
		gacha_attribute_array: items.map((item) => item.element),
		gacha_moon_array: items.map((_, index) => moons[index] ?? 0),
		limited_gene_attribute: items.map(() => 0),
		gacha_text1: names,
		gacha_scene1_skip_flg: skippedScene1
	}
}
