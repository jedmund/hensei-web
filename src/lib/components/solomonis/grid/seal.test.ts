import { describe, it, expect } from 'vitest'
import type { Party } from '$lib/types/api/party'
import type { SolomonisExpedition } from '$lib/types/api/solomonis'
import { transformResponse } from '$lib/api/schemas/transforms'
import buildJson from './__fixtures__/party-build.json'
import runJson from './__fixtures__/party-run.json'
import realBuildJson from './__fixtures__/real/party-build.json'
import realRunJson from './__fixtures__/real/party-run.json'
import realPriorityJson from './__fixtures__/real/put-unseal-priority-200.json'
import {
	applyPriorities,
	canMarkBroughtByBlessing,
	characterSlotCount,
	entryKey,
	getExpedition,
	isStartingSlot,
	priorityLists,
	rankAt,
	SOLOMONIS_CHARACTER_LIMIT,
	setPriority,
	slotSeal,
	toPriorityPayload,
	unrank
} from './seal'

function load(json: unknown): Party {
	return transformResponse<{ party: Party }>(json).party
}

function withBlessings(party: Party, slugs: string[]): Party {
	const expedition = getExpedition(party)!
	return {
		...party,
		solomonis: {
			...expedition,
			blessings: slugs.map((slug, i) => ({
				blessing: { id: `b${i}`, slug, arcanaNumber: 11 + i, name: { en: slug, ja: null } },
				levelId: `l${i}`,
				level: 1,
				cost: 10
			}))
		}
	}
}

// Two sample parties: one shaped like a party deck import (non-starting slots
// sealed, some ranked), one like a finished expedition (partly unsealed).
const deck = () => load(buildJson)
const report = () => load(runJson)

describe('getExpedition', () => {
	it('reads the full view and ignores list summaries', () => {
		expect(getExpedition(deck())?.routeEvoker).toBeTruthy()
		const summary = { ...deck(), solomonis: { routeEvokerId: 'x', pledgeLevel: 0 } }
		expect(getExpedition(summary as Party)).toBeNull()
		expect(getExpedition({ ...deck(), solomonis: null })).toBeNull()
	})
})

describe('isStartingSlot', () => {
	it('fixes the mainhand and positions 0 and 1', () => {
		expect([-1, 0, 1, 2, 3].map((p) => isStartingSlot('weapon', p, false))).toEqual([
			true,
			true,
			true,
			false,
			false
		])
	})

	it('adds position 2 with Justice', () => {
		expect(isStartingSlot('weapon', 2, true)).toBe(true)
		expect(isStartingSlot('weapon', 3, true)).toBe(false)
	})

	it('only starts the main summon', () => {
		expect(isStartingSlot('summon', -1, true)).toBe(true)
		expect(isStartingSlot('summon', 0, true)).toBe(false)
		expect(isStartingSlot('summon', 4, true)).toBe(false)
	})
})

describe('slotSeal', () => {
	it('shows sealed slots dimmed, with their priority and a control', () => {
		const party = deck()
		const expedition = getExpedition(party)!
		const at = (p: number) => party.weapons.find((w) => w.position === p)
		expect(slotSeal(expedition, 'weapon', 2, at(2))).toMatchObject({
			state: 'start',
			starting: true,
			editable: false
		})
		expect(slotSeal(expedition, 'weapon', 4, at(4))).toEqual({
			state: 'sealed',
			starting: false,
			dimmed: true,
			editable: true,
			priority: 1
		})
		expect(slotSeal(expedition, 'weapon', 5, at(5)).priority).toBeNull()
	})

	it('keeps recorded states and offers a control outside starting slots', () => {
		const party = report()
		const expedition = getExpedition(party)!
		const at = (p: number) => party.weapons.find((w) => w.position === p)
		expect(slotSeal(expedition, 'weapon', 3, at(3))).toMatchObject({
			state: 'unsealed',
			dimmed: false,
			editable: true,
			priority: null
		})
		expect(slotSeal(expedition, 'weapon', 5, at(5))).toMatchObject({
			state: 'sealed',
			dimmed: true,
			editable: true
		})
		expect(slotSeal(expedition, 'weapon', 0, at(0))).toMatchObject({
			state: 'start',
			editable: false
		})
		expect(slotSeal(expedition, 'summon', -1, party.summons[0]).editable).toBe(false)
	})

	it('ignores a priority left on a slot that is not sealed', () => {
		const expedition = getExpedition(report())!
		expect(
			slotSeal(expedition, 'weapon', 3, { sealState: 'unsealed', unsealPriority: 2 }).priority
		).toBeNull()
	})

	it('shows unknown (null) states without dimming', () => {
		const expedition = getExpedition(report())!
		expect(
			slotSeal(expedition, 'summon', 2, { sealState: null, unsealPriority: null })
		).toMatchObject({ state: null, dimmed: false, editable: true })
	})

	it('treats a stale start as unknown once Justice is removed, before the API recomputes', () => {
		const party = withBlessings(deck(), ['death'])
		const expedition = getExpedition(party)!
		const item = party.weapons.find((w) => w.position === 2)
		expect(item?.sealState).toBe('start')
		expect(slotSeal(expedition, 'weapon', 2, item).state).toBeNull()
	})

	it('does not dim empty slots', () => {
		const expedition = getExpedition(deck())!
		expect(slotSeal(expedition, 'weapon', 7, undefined).dimmed).toBe(false)
	})
})

describe('character limits', () => {
	it('allows the route Evoker and four recruits', () => {
		expect(SOLOMONIS_CHARACTER_LIMIT).toBe(5)
		expect(characterSlotCount([{ position: 0 }])).toBe(5)
	})

	it('renders extra slots rather than hiding characters past the limit', () => {
		expect(characterSlotCount([{ position: 0 }, { position: 6 }])).toBe(7)
	})

	it('lets one non-Evoker ally be marked as brought by The Hanged Man', () => {
		const party = withBlessings(report(), ['hanged_man'])
		const expedition = getExpedition(party) as SolomonisExpedition
		const [evoker, ally1, ally2] = party.characters
		expect(canMarkBroughtByBlessing(expedition, party.characters, evoker)).toBe(false)
		expect(canMarkBroughtByBlessing(expedition, party.characters, ally1)).toBe(true)

		const marked = party.characters.map((c) =>
			c.id === ally1!.id ? { ...c, broughtByBlessing: true } : c
		)
		expect(canMarkBroughtByBlessing(expedition, marked, marked[1])).toBe(true)
		expect(canMarkBroughtByBlessing(expedition, marked, ally2)).toBe(false)
	})

	it('needs The Hanged Man', () => {
		const party = report()
		expect(
			canMarkBroughtByBlessing(getExpedition(party)!, party.characters, party.characters[1])
		).toBe(false)
	})
})

describe('unseal priority lists', () => {
	const at = (entries: { type: string; position: number }[]) =>
		entries.map((e) => `${e.type}${e.position}`)

	it('splits each type into ranked and unranked', () => {
		const lists = priorityLists(deck())
		expect(at(lists.weapon.ranked)).toEqual(['weapon4', 'weapon7', 'weapon3'])
		expect(at(lists.weapon.unranked)).toEqual(['weapon5', 'weapon6', 'weapon8'])
		expect(at(lists.summon.ranked)).toEqual(['summon0'])
		expect(at(lists.summon.unranked)).toEqual([
			'summon1',
			'summon2',
			'summon3',
			'summon4',
			'summon5'
		])
	})

	it('lists only sealed items on a partly unsealed party', () => {
		const lists = priorityLists(report())
		const all = [...lists.weapon.unranked, ...lists.summon.unranked]
		expect([...lists.weapon.ranked, ...lists.summon.ranked]).toEqual([])
		expect(all.every((e) => e.item.sealState === 'sealed')).toBe(true)
		expect(all.length).toBeGreaterThan(0)
	})

	it('ranks, reorders and unranks within one type', () => {
		let list = priorityLists(deck()).summon
		const summon1 = entryKey(list.unranked.find((e) => e.position === 1)!)
		list = rankAt(list, summon1, 0)
		expect(at(list.ranked)).toEqual(['summon1', 'summon0'])
		expect(list.unranked.some((e) => entryKey(e) === summon1)).toBe(false)

		// Past the end appends
		const summon5 = entryKey(list.unranked[list.unranked.length - 1]!)
		list = rankAt(list, summon5, 99)
		expect(entryKey(list.ranked[list.ranked.length - 1]!)).toBe(summon5)

		list = unrank(list, summon1)
		expect(at(list.ranked)).toEqual(['summon0', 'summon5'])
		expect(at(list.unranked)).toContain('summon1')
	})

	it("sets one entry's rank without touching the other type", () => {
		const lists = priorityLists(deck())
		const weapon5 = entryKey(lists.weapon.unranked[0]!)
		const next = setPriority(lists, 'weapon', weapon5, 1)
		expect(at(next.weapon.ranked)).toEqual(['weapon5', 'weapon4', 'weapon7', 'weapon3'])
		expect(next.summon).toBe(lists.summon)

		const cleared = setPriority(next, 'weapon', weapon5, null)
		expect(at(cleared.weapon.ranked)).toEqual(['weapon4', 'weapon7', 'weapon3'])
	})

	it('builds the PUT payload and numbers each type from 1', () => {
		const party = deck()
		const lists = priorityLists(party)
		const payload = toPriorityPayload(lists)
		expect(payload.map((item) => item.type)).toEqual(['weapon', 'weapon', 'weapon', 'summon'])

		const next = applyPriorities(party, payload)
		const weapon = (id: string) => next.weapons.find((w) => w.id === id)?.unsealPriority
		expect(weapon(lists.weapon.ranked[0]!.id)).toBe(1)
		expect(weapon(lists.weapon.ranked[2]!.id)).toBe(3)
		expect(next.summons.find((s) => s.id === lists.summon.ranked[0]!.id)?.unsealPriority).toBe(1)
		expect(weapon(lists.weapon.unranked[0]!.id)).toBeNull()
	})
})

describe('real API responses (api-endpoints)', () => {
	it('reads seal states and priorities from an unsorted grid', () => {
		const party = load(realBuildJson)
		const expedition = getExpedition(party)!
		const at = (p: number) => party.weapons.find((w) => w.position === p)
		expect(slotSeal(expedition, 'weapon', 2, at(2)).state).toBe('start')
		expect(slotSeal(expedition, 'weapon', 5, at(5)).priority).toBe(1)

		const lists = priorityLists(party)
		expect(lists.weapon.ranked.map((e) => e.position)).toEqual([5])
		expect(lists.summon.ranked.map((e) => e.position)).toEqual([0])
		expect(lists.weapon.unranked.map((e) => e.position)).toEqual([6])
	})

	it('keeps a recorded seal state', () => {
		const party = load(realRunJson)
		const expedition = getExpedition(party)!
		const weapon = party.weapons.find((w) => w.position === 5)
		expect(slotSeal(expedition, 'weapon', 5, weapon)).toMatchObject({
			state: 'unsealed',
			editable: true
		})
	})

	it('applies the priority write response as a whole party', () => {
		const party = load(realPriorityJson)
		const lists = priorityLists(party)
		expect(lists.weapon.ranked.length + lists.summon.ranked.length).toBe(2)
	})
})
