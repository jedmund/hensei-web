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
	/** Numeric value (percent, or flat count for supplements) */
	value: number
	/** Preformatted display string (e.g. "756.8%", "+100,000") */
	display: string
	/** True when the value sits at its in-game display cap */
	capped: boolean
}

export interface SkillBoosts {
	/** Per-frame weapon skill enhancement totals (percent) */
	enhancements: {
		optimus: number
		omega: number
		taboo: number
	}
	lines: SkillBoostLine[]
}
