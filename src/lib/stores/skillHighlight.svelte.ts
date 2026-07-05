/**
 * SkillHighlightStore
 *
 * Tracks the grid weapons contributing to a hovered Weapon Skill Boost line
 * (CalculatorPane). While a set is active, weapon units not in it dim so the
 * contributors stand out.
 */
class SkillHighlightStore {
	weaponIds = $state<Set<string> | null>(null)

	set(ids: string[] | null | undefined) {
		this.weaponIds = ids && ids.length > 0 ? new Set(ids) : null
	}

	clear() {
		this.weaponIds = null
	}

	/** True while a highlight is active */
	get active(): boolean {
		return this.weaponIds !== null
	}

	/** Whether the given grid weapon id is a contributor of the hovered line */
	contributes(id: string | undefined): boolean {
		return !!id && !!this.weaponIds?.has(id)
	}
}

export const skillHighlight = new SkillHighlightStore()
