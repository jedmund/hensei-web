/**
 * Weapon Skill Boosts panel — the computed in-game "Estimated Damage" breakdown
 * served by GET /parties/:shortcode/skill_boosts.
 */

export interface SkillBoostLine {
	/** Boost type key (e.g. "atk", "skill_dmg_cap") */
	key: string
	/** Frame for per-frame boosts ("normal" | "omega" | "ex") or null */
	series: string | null
	/** Panel label (e.g. "Ω Might", "Skill DMG Cap") */
	label: string
	/** In-game label texture slug (e.g. "omega-might"), or null when no badge exists */
	labelSlug: string | null
	/** Game panel group: attack | hp | defense | special | overskill | ax | other */
	group: string
	/** Numeric value (percent, or flat count for supplements) */
	value: number
	/** Preformatted display string (e.g. "756.8%", "+100,000") */
	display: string
	/** True when the value sits at its in-game display cap */
	capped: boolean
	/** Grid weapon ids contributing to this line (for grid highlighting) */
	sources: string[]
	/** Per-skill entries explaining the line's math */
	breakdown: SkillBoostEntry[]
}

export interface SkillBoostEntry {
	/** Producing skill/key/awakening name */
	name: { en: string | null; ja: string | null }
	/** Weapon-skill icon stem (getWeaponSkillIcon), or null when no icon exists */
	icon: string | null
	/** Contribution value per copy (post-amplification) */
	value: number
	/** Pre-amplification value when the enhancement multiplied this entry */
	base: number | null
	/** Enhancement multiplier applied to base (e.g. 5.6) */
	multiplier: number | null
	/** Number of identical copies contributing this value each */
	count: number
}

export interface SkillBoostState {
	/** Party HP percent the panel is evaluated at (0-100) */
	hpPercent: number
	/** Battle turn (1+) */
	turn: number
	/** Foe element ("fire" | "water" | ... ), server-defaulted to the advantaged foe */
	foeElement?: string
}

export interface SkillBoosts {
	/** Per-frame weapon skill enhancement totals (percent) */
	enhancements: {
		optimus: number
		omega: number
		taboo: number
	}
	lines: SkillBoostLine[]
	/** The battle state the panel was computed at (clamped/defaulted server-side) */
	state: SkillBoostState
}
