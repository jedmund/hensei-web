/**
 * SkillHighlightStore
 *
 * Tracks the grid items behind a hovered row in the CalculatorPane: the grid weapons
 * contributing to a Weapon Skill Boost line, or the grid summon giving an aura. While a
 * set is active, the units of that kind not in it dim so the contributors stand out.
 */
class SkillHighlightStore {
	weaponIds = $state<Set<string> | null>(null)
	summonIds = $state<Set<string> | null>(null)

	set(ids: string[] | null | undefined) {
		this.weaponIds = ids && ids.length > 0 ? new Set(ids) : null
	}

	setSummons(ids: string[] | null | undefined) {
		this.summonIds = ids && ids.length > 0 ? new Set(ids) : null
	}

	clear() {
		this.weaponIds = null
		this.summonIds = null
	}

	/** True while a highlight is active */
	get active(): boolean {
		return this.weaponIds !== null
	}

	/** Whether the given grid weapon id is a contributor of the hovered line */
	contributes(id: string | undefined): boolean {
		return !!id && !!this.weaponIds?.has(id)
	}

	/** True while a summon highlight is active */
	get summonActive(): boolean {
		return this.summonIds !== null
	}

	/** Whether the given grid summon id gives the hovered aura */
	summonContributes(id: string | undefined): boolean {
		return !!id && !!this.summonIds?.has(id)
	}
}

export const skillHighlight = new SkillHighlightStore()
