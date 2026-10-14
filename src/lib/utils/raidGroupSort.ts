/**
 * Raid picker ordering.
 *
 * @module utils/raidGroupSort
 */

import { RaidSection } from '$lib/utils/raidSection'

interface SortableRaidGroup {
	difficulty: number
	order: number
}

/**
 * Sorts a section's raid groups for the raid picker. Solo content mostly has
 * no difficulty, so it follows the display order (newest content highest);
 * every other section sorts by difficulty alone.
 */
export function sortRaidGroups<T extends SortableRaidGroup>(
	groups: readonly T[],
	section: RaidSection,
	ascending: boolean
): T[] {
	if (section === RaidSection.Solo) {
		return [...groups].sort((a, b) => {
			const result = a.order - b.order
			return ascending ? result : -result
		})
	}
	return [...groups].sort((a, b) => {
		const diff = a.difficulty - b.difficulty
		return ascending ? diff : -diff
	})
}
