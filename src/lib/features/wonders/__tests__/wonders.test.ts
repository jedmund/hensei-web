import { describe, it, expect } from 'vitest'
import {
	appliesToTeam,
	computeBonuses,
	defaultState,
	editableOnTeam,
	formatBonusNumber,
	groupByCategory,
	isUniteAndFightParty,
	joinWonders,
	maxLevelFor,
	normalizeState,
	partyWondersWith,
	partyWondersWithout,
	symbolumBonus,
	symbolumRecruitsUntilNext,
	visiblePartyWonders,
	wonderImageName
} from '../wonders'
import {
	catalogue,
	fireSeal,
	owned,
	ringOfDeath,
	shield,
	symbolum,
	tiamat,
	waterSeal,
	zhurong
} from '../__fixtures__/catalogue'

const uaf = { group: { contentMode: 'unite_and_fight' } }

describe('isUniteAndFightParty', () => {
	it('reads the raid group content mode', () => {
		expect(isUniteAndFightParty({ raid: uaf })).toBe(true)
		expect(isUniteAndFightParty({ raid: { group: { contentMode: 'solomonis' } } })).toBe(false)
		expect(isUniteAndFightParty({ raid: { group: null } })).toBe(false)
		expect(isUniteAndFightParty({})).toBe(false)
	})
})

describe('appliesToTeam', () => {
	it('shows all-element Wonders on every team', () => {
		expect(appliesToTeam(shield, { element: 3, uniteAndFight: false })).toBe(true)
	})

	it("shows element Wonders only on their element's teams", () => {
		expect(appliesToTeam(waterSeal, { element: 2, uniteAndFight: false })).toBe(true)
		expect(appliesToTeam(waterSeal, { element: 1, uniteAndFight: false })).toBe(false)
		expect(appliesToTeam(ringOfDeath, { element: 6, uniteAndFight: false })).toBe(true)
	})

	it('shows only all-element Wonders when the team has no element', () => {
		expect(appliesToTeam(waterSeal, { element: null, uniteAndFight: false })).toBe(false)
		expect(appliesToTeam(shield, { element: null, uniteAndFight: false })).toBe(true)
	})

	it('treats element 0 (Null) as an element, not as all', () => {
		expect(appliesToTeam({ ...shield, element: 0 }, { element: 1, uniteAndFight: false })).toBe(
			false
		)
	})

	it('hides Seals on Unite and Fight teams', () => {
		expect(appliesToTeam(waterSeal, { element: 2, uniteAndFight: true })).toBe(false)
		expect(appliesToTeam(shield, { element: 2, uniteAndFight: true })).toBe(true)
	})
})

describe('editableOnTeam', () => {
	it('offers battle-relevant Wonders of every element', () => {
		const ctx = { element: 1, uniteAndFight: false }
		expect(editableOnTeam(waterSeal, ctx)).toBe(true)
		expect(editableOnTeam(ringOfDeath, ctx)).toBe(true)
		expect(editableOnTeam(tiamat, ctx)).toBe(false)
	})

	it('leaves out Seals on Unite and Fight teams', () => {
		const ctx = { element: 1, uniteAndFight: true }
		expect(editableOnTeam(fireSeal, ctx)).toBe(false)
		expect(editableOnTeam(symbolum, ctx)).toBe(true)
	})
})

describe('visiblePartyWonders', () => {
	const wonders = [
		owned(ringOfDeath),
		owned(waterSeal, { level: 20, evolution: 3 }),
		owned(fireSeal, { level: 20, evolution: 3 }),
		owned(shield),
		owned(zhurong, { level: 10, evolution: 0 })
	]

	it("keeps the team's element and all-element Wonders, in catalogue order", () => {
		const visible = visiblePartyWonders({ element: 1, wonders }, catalogue)
		expect(visible.map((j) => j.wonder.id)).toEqual([fireSeal.id, shield.id, zhurong.id])
	})

	it('drops Seals on a Unite and Fight team, and shows them again after the raid changes', () => {
		const onUaf = visiblePartyWonders({ element: 1, raid: uaf, wonders }, catalogue)
		expect(onUaf.map((j) => j.wonder.id)).toEqual([shield.id, zhurong.id])

		const moved = visiblePartyWonders({ element: 1, raid: { group: null }, wonders }, catalogue)
		expect(moved.map((j) => j.wonder.id)).toContain(fireSeal.id)
	})

	it('ignores rows the catalogue does not know', () => {
		const unknown = { ...owned(shield), wonderId: 'missing' }
		expect(visiblePartyWonders({ wonders: [unknown] }, catalogue)).toEqual([])
	})

	it('handles a party without Wonders', () => {
		expect(visiblePartyWonders({ element: 1 }, catalogue)).toEqual([])
	})
})

describe('groupByCategory', () => {
	it('groups in category order and leaves out empty categories', () => {
		const joined = joinWonders([owned(zhurong), owned(tiamat), owned(shield)], catalogue)
		const groups = groupByCategory(joined, (j) => j.wonder, catalogue)
		expect(groups.map((g) => g.category.granblueId)).toEqual(['1', '5', '6'])
	})
})

describe('levels', () => {
	it('caps Seal levels by evolution', () => {
		expect([0, 1, 2, 3].map((e) => maxLevelFor(waterSeal, e))).toEqual([10, 15, 18, 20])
	})

	it('uses max_level for Wonders without evolution', () => {
		expect(maxLevelFor(zhurong, 0)).toBe(10)
	})

	it('clamps the level when evolution drops', () => {
		expect(normalizeState(waterSeal, { level: 20, evolution: 1 })).toEqual({
			level: 15,
			evolution: 1,
			possession: null
		})
	})

	it('nulls fields that do not apply to the kind', () => {
		expect(normalizeState(shield, { level: 1, evolution: 0, possession: 3 })).toEqual({
			level: null,
			evolution: null,
			possession: null
		})
		expect(normalizeState(symbolum, { level: 1, possession: 900 })).toEqual({
			level: null,
			evolution: null,
			possession: 900
		})
	})

	it('starts new leveled Wonders fully uncapped', () => {
		expect(defaultState(waterSeal)).toEqual({ level: 20, evolution: 3, possession: null })
	})
})

describe('symbolumRecruitsUntilNext', () => {
	it("counts to the game's next_upgrade", () => {
		// Captures: 900 -> 910, 835 -> 840
		expect(symbolumRecruitsUntilNext(900)).toBe(10)
		expect(symbolumRecruitsUntilNext(835)).toBe(5)
		expect(symbolumRecruitsUntilNext(756)).toBe(4)
		expect(symbolumRecruitsUntilNext(0)).toBe(300)
		expect(symbolumRecruitsUntilNext(299)).toBe(1)
		expect(symbolumRecruitsUntilNext(300)).toBe(300)
		expect(symbolumRecruitsUntilNext(600)).toBe(10)
		expect(symbolumRecruitsUntilNext(999)).toBe(1)
	})

	it('is null once capped', () => {
		expect(symbolumRecruitsUntilNext(1000)).toBeNull()
		expect(symbolumRecruitsUntilNext(1200)).toBeNull()
	})
})

describe('symbolumBonus', () => {
	it.each([
		[0, 0],
		[299, 0],
		[300, 0.5],
		[599, 0.5],
		[600, 1],
		[609, 1],
		[610, 1.1],
		[900, 4],
		[1000, 5],
		[1500, 5]
	])('%i characters gives %d', (count, bonus) => {
		expect(symbolumBonus(count)).toBe(bonus)
	})

	it('is exact where floats are not', () => {
		expect(symbolumBonus(800)).toBe(3)
	})
})

describe('computeBonuses', () => {
	it('sums a level 20 Seal like the capture', () => {
		expect(computeBonuses(waterSeal, { level: 20, evolution: 3, possession: null })).toEqual([
			{ stat: 'fire_resistance', value: 10 },
			{ stat: 'def', value: 12 },
			{ stat: 'double_attack_rate', value: 6 },
			{ stat: 'healing_cap', value: 12 },
			{ stat: 'debuff_resistance', value: 10 },
			{ stat: 'triple_attack_rate', value: 7 },
			{ stat: 'debuff_success_rate', value: 5 }
		])
	})

	it('sums a level 10 Yupei like the capture', () => {
		expect(computeBonuses(zhurong, { level: 10, evolution: 0, possession: null })).toEqual([
			{ stat: 'fire_atk', value: 10 },
			{ stat: 'def', value: 10 },
			{ stat: 'skill_dmg', value: 5 },
			{ stat: 'ca_dmg', value: 5 },
			{ stat: 'dmg_amplify_vs_wind', value: 5 },
			{ stat: 'na_dmg_cap', value: 5 },
			{ stat: 'skill_dmg_cap', value: 5 },
			{ stat: 'ca_dmg_cap', value: 5 }
		])
	})

	it('stops at the level', () => {
		expect(computeBonuses(waterSeal, { level: 2, evolution: 0, possession: null })).toEqual([
			{ stat: 'fire_resistance', value: 5 },
			{ stat: 'def', value: 3 }
		])
	})

	it('gives Symbolum its DMG Amplify and fixed Wonders nothing', () => {
		expect(computeBonuses(symbolum, { level: null, evolution: null, possession: 900 })).toEqual([
			{ stat: 'dmg_amplify', value: 4 }
		])
		expect(computeBonuses(shield, { level: null, evolution: null, possession: null })).toEqual([])
	})
})

describe('formatBonusNumber', () => {
	it('drops trailing zeros and float noise', () => {
		expect(formatBonusNumber(4)).toBe('4')
		expect(formatBonusNumber(0.5)).toBe('0.5')
		expect(formatBonusNumber(0.1 + 0.2)).toBe('0.3')
	})
})

describe('wonderImageName', () => {
	it('mirrors the API image rule', () => {
		expect(wonderImageName(waterSeal, { level: 18, evolution: 2, possession: null })).toBe(
			'9008_18'
		)
		expect(
			wonderImageName(symbolum, { level: null, evolution: null, possession: 900 }, '9015_10')
		).toBe('9015_10')
		expect(wonderImageName(symbolum, { level: null, evolution: null, possession: 0 })).toBe('9015')
		expect(wonderImageName(shield, { level: null, evolution: null, possession: null })).toBe('9003')
	})
})

describe('partyWondersWith', () => {
	const existing = [owned(waterSeal, { level: 20, evolution: 3 }), owned(shield)]

	it('replaces the Wonder in place and keeps the rest', () => {
		expect(
			partyWondersWith(existing, waterSeal, { level: 20, evolution: 0, possession: 5 })
		).toEqual([
			{ wonderId: waterSeal.id, level: 10, evolution: 0, possession: null },
			{ wonderId: shield.id, level: null, evolution: null, possession: null }
		])
	})

	it('adds a Wonder the team does not have at the end', () => {
		expect(
			partyWondersWith(existing, symbolum, { level: null, evolution: null, possession: 650 })
		).toEqual([
			{ wonderId: waterSeal.id, level: 20, evolution: 3, possession: null },
			{ wonderId: shield.id, level: null, evolution: null, possession: null },
			{ wonderId: symbolum.id, level: null, evolution: null, possession: 650 }
		])
	})
})

describe('partyWondersWithout', () => {
	it('drops only that Wonder', () => {
		const existing = [owned(waterSeal, { level: 20, evolution: 3 }), owned(shield)]
		expect(partyWondersWithout(existing, shield.id)).toEqual([
			{ wonderId: waterSeal.id, level: 20, evolution: 3, possession: null }
		])
	})
})
