import { describe, it, expect } from 'vitest'
import { sortRaidGroups } from '../raidGroupSort'
import { RaidSection } from '$lib/utils/raidSection'

const groups = [
	{ id: 'a', difficulty: 2, order: 3 },
	{ id: 'b', difficulty: 1, order: 4 },
	{ id: 'c', difficulty: 2, order: 1 },
	{ id: 'd', difficulty: 1, order: 2 }
]
const ids = (list: { id: string }[]) => list.map((g) => g.id)

describe('sortRaidGroups', () => {
	it('sorts Solo by display order', () => {
		expect(ids(sortRaidGroups(groups, RaidSection.Solo, true))).toEqual(['c', 'd', 'a', 'b'])
		expect(ids(sortRaidGroups(groups, RaidSection.Solo, false))).toEqual(['b', 'a', 'd', 'c'])
	})

	it('sorts other sections by difficulty alone, keeping ties in place', () => {
		expect(ids(sortRaidGroups(groups, RaidSection.Raid, true))).toEqual(['b', 'd', 'a', 'c'])
		expect(ids(sortRaidGroups(groups, RaidSection.Raid, false))).toEqual(['a', 'c', 'b', 'd'])
		expect(ids(sortRaidGroups(groups, RaidSection.Event, false))).toEqual(['a', 'c', 'b', 'd'])
	})

	it('does not mutate the input', () => {
		const copy = [...groups]
		sortRaidGroups(groups, RaidSection.Solo, true)
		expect(groups).toEqual(copy)
	})
})
