/**
 * Wonder copy: stat names and bonus values, in the game's terms. Stat keys
 * are ours (GBF-282); element stats take the element's name.
 *
 * @module features/wonders/labels
 */

import { m } from '$lib/paraglide/messages'
import { getElementLabel } from '$lib/utils/element'
import { appLocale } from '$lib/utils/locale'
import type {
	OwnedWonder,
	Wonder,
	WonderBonus,
	WonderStat,
	WonderStatElement,
	WonderText
} from '$lib/types/api/wonder'
import { formatBonusNumber } from './wonders'

export const WONDER_STAT_ELEMENTS: Record<WonderStatElement, number> = {
	fire: 1,
	water: 2,
	earth: 3,
	wind: 4,
	light: 5,
	dark: 6
}

type ElementFamily = 'resistance' | 'atk' | 'dmg_amplify_vs'
type PlainStat = Exclude<
	WonderStat,
	| `${WonderStatElement}_resistance`
	| `${WonderStatElement}_atk`
	| `dmg_amplify_vs_${WonderStatElement}`
>

const PLAIN_STATS: Record<PlainStat, () => string> = {
	def: m.wonders_stat_def,
	double_attack_rate: m.wonders_stat_double_attack_rate,
	triple_attack_rate: m.wonders_stat_triple_attack_rate,
	healing_cap: m.wonders_stat_healing_cap,
	debuff_resistance: m.wonders_stat_debuff_resistance,
	debuff_success_rate: m.wonders_stat_debuff_success_rate,
	skill_dmg: m.wonders_stat_skill_dmg,
	ca_dmg: m.wonders_stat_ca_dmg,
	na_dmg_cap: m.wonders_stat_na_dmg_cap,
	skill_dmg_cap: m.wonders_stat_skill_dmg_cap,
	ca_dmg_cap: m.wonders_stat_ca_dmg_cap,
	dmg_amplify: m.wonders_stat_dmg_amplify
}

const ELEMENT_FAMILIES: Record<ElementFamily, (inputs: { element: string }) => string> = {
	resistance: m.wonders_stat_resistance,
	atk: m.wonders_stat_atk,
	dmg_amplify_vs: m.wonders_stat_dmg_amplify_vs
}

const ELEMENT_STAT = /^(?:dmg_amplify_vs_(\w+)|(\w+)_(resistance|atk))$/

/** Splits an element stat into its family and element; null for the others. */
export function parseElementStat(
	stat: string
): { family: ElementFamily; element: WonderStatElement } | null {
	const match = ELEMENT_STAT.exec(stat)
	if (!match) return null
	const element = (match[1] ?? match[2]) as WonderStatElement
	if (!(element in WONDER_STAT_ELEMENTS)) return null
	const family = (match[1] ? 'dmg_amplify_vs' : match[3]) as ElementFamily
	return { family, element }
}

// The game's bonus icon ids (`effective_acquired_bonus[].image`), matched to
// in-game screenshots of every Seal and Yupei. An element's resistance and
// ATK share one icon; caps share their stat's icon.
const ELEMENT_BONUS_ICONS: Record<WonderStatElement, string> = {
	wind: 'bonus_7',
	fire: 'bonus_8',
	water: 'bonus_9',
	earth: 'bonus_10',
	light: 'bonus_11',
	dark: 'bonus_12'
}

const PLAIN_BONUS_ICONS: Record<PlainStat, string> = {
	def: 'bonus_2',
	debuff_resistance: 'bonus_3',
	debuff_success_rate: 'bonus_4',
	healing_cap: 'bonus_13',
	double_attack_rate: 'bonus_20',
	triple_attack_rate: 'bonus_21',
	skill_dmg: 'bonus_18',
	skill_dmg_cap: 'bonus_18',
	ca_dmg: 'bonus_19',
	ca_dmg_cap: 'bonus_19',
	na_dmg_cap: 'bonus_1',
	dmg_amplify: 'bonus_1'
}

/** A stat's game icon id, or null for a stat we don't know. */
export function bonusIcon(stat: string): string | null {
	const elemental = parseElementStat(stat)
	if (elemental) {
		return elemental.family === 'dmg_amplify_vs'
			? 'bonus_1'
			: ELEMENT_BONUS_ICONS[elemental.element]
	}
	return PLAIN_BONUS_ICONS[stat as PlainStat] ?? null
}

/** A stat's display name. Unknown keys show as they are. */
export function statLabel(stat: string): string {
	const elemental = parseElementStat(stat)
	if (elemental) {
		const element = getElementLabel(WONDER_STAT_ELEMENTS[elemental.element])
		return ELEMENT_FAMILIES[elemental.family]({ element })
	}
	const plain = PLAIN_STATS[stat as PlainStat]
	return plain ? plain() : stat
}

/** A bonus value as the game shows it: +12% (EN), ＋12％ (JA). */
export function bonusValueLabel(value: number): string {
	return m.wonders_bonus_value({ value: formatBonusNumber(value) })
}

export function bonusLabel(bonus: WonderBonus): { label: string; value: string } {
	return { label: statLabel(bonus.stat), value: bonusValueLabel(bonus.value) }
}

/** A Wonder's name or text in the app's language, falling back to the other. */
/** A Wonder's effect lines in the viewer's language, in the game's order. Empty lines are dropped. */
export function wonderEffectTexts(wonder: Pick<Wonder, 'effects'>): string[] {
	return [...wonder.effects]
		.sort((a, b) => a.position - b.position)
		.map((e) => wonderText(e.text))
		.filter((text) => text !== '—')
}

export function wonderText(text: WonderText | null | undefined): string {
	if (!text) return '—'
	return text[appLocale()] || text.en || text.ja || '—'
}

/**
 * The short line under a Wonder's image: its level (Seals, Yupei) or its
 * bonus (Symbolum). Fixed Wonders have none. Symbolum's count itself is
 * never shown on a team, only the bonus it gives.
 */
export function wonderSummary(
	wonder: Pick<Wonder, 'kind'>,
	row: Pick<OwnedWonder, 'level' | 'bonuses'>
): string | null {
	if (wonder.kind === 'leveled' && row.level != null) return m.wonders_level({ level: row.level })
	if (wonder.kind === 'scaling') {
		const bonus = row.bonuses[0]
		return bonus ? bonusValueLabel(bonus.value) : null
	}
	return null
}
