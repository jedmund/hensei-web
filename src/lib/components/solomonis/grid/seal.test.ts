import { describe, it, expect } from 'vitest'
import type { Party } from '$lib/types/api/party'
import type { SolomonisExpedition } from '$lib/types/api/solomonis'
import { transformResponse } from '$lib/api/schemas/transforms'
import buildJson from './__fixtures__/party-build.json'
import runJson from './__fixtures__/party-run.json'
import {
	applyPriorities,
	canMarkBroughtByBlessing,
	characterSlotCount,
	characterSlotLimit,
	circledNumber,
	entryKey,
	getExpedition,
	isStartingSlot,
	priorityLists,
	rankAt,
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

const build = () => load(buildJson)
const run = () => load(runJson)

describe('getExpedition', () => {
	it('reads the full view and ignores list summaries', () => {
		expect(getExpedition(build())?.kind).toBe('build')
		const summary = { ...build(), solomonis: { kind: 'build', routeEvokerId: 'x', pledgeLevel: 0 } }
		expect(getExpedition(summary as Party)).toBeNull()
		expect(getExpedition({ ...build(), solomonis: null })).toBeNull()
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

describe('slotSeal on builds', () => {
	it('derives states and shows priorities, with no controls', () => {
		const party = build()
		const expedition = getExpedition(party)!
		const at = (p: number) => party.weapons.find((w) => w.position === p)
		expect(slotSeal(expedition, 'weapon', 2, at(2))).toMatchObject({
			state: 'start',
			starting: true
		})
		expect(slotSeal(expedition, 'weapon', 4, at(4))).toEqual({
			state: 'sealed',
			starting: false,
			dimmed: true,
			editable: false,
			priority: 1
		})
		expect(slotSeal(expedition, 'weapon', 5, at(5)).priority).toBeNull()
	})

	it('reseals position 2 when Justice is removed, before the API recomputes', () => {
		const party = withBlessings(build(), ['death'])
		const expedition = getExpedition(party)!
		const item = party.weapons.find((w) => w.position === 2)
		expect(slotSeal(expedition, 'weapon', 2, item).state).toBe('sealed')
	})

	it('does not dim empty slots', () => {
		const expedition = getExpedition(build())!
		expect(slotSeal(expedition, 'weapon', 7, undefined).dimmed).toBe(false)
	})
})

describe('slotSeal on runs', () => {
	it('keeps recorded states and offers a control outside starting slots', () => {
		const party = run()
		const expedition = getExpedition(party)!
		const at = (p: number) => party.weapons.find((w) => w.position === p)
		expect(slotSeal(expedition, 'weapon', 3, at(3))).toMatchObject({
			state: 'unsealed',
			dimmed: false,
			editable: true
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

	it('shows unknown (null) states from imports without dimming', () => {
		const expedition = getExpedition(run())!
		expect(
			slotSeal(expedition, 'summon', 2, { sealState: null, unsealPriority: null })
		).toMatchObject({ state: null, dimmed: false, editable: true })
	})

	it('treats a stale start outside the starting slots as unknown', () => {
		const expedition = getExpedition(withBlessings(run(), []))!
		expect(
			slotSeal(expedition, 'weapon', 2, { sealState: 'start', unsealPriority: null }).state
		).toBeNull()
	})
})

describe('character limits', () => {
	it('allows only the route Evoker on a build, plus one with The Hanged Man', () => {
		expect(characterSlotLimit(getExpedition(build())!)).toBe(1)
		expect(characterSlotLimit(getExpedition(withBlessings(build(), ['hanged_man']))!)).toBe(2)
	})

	it('allows the route Evoker and four allies on a run', () => {
		expect(characterSlotLimit(getExpedition(withBlessings(run(), ['hanged_man']))!)).toBe(5)
	})

	it('renders extra slots rather than hiding characters past the limit', () => {
		const expedition = getExpedition(build())!
		expect(characterSlotCount(expedition, [{ position: 0 }])).toBe(1)
		expect(characterSlotCount(expedition, [{ position: 0 }, { position: 2 }])).toBe(3)
	})

	it('lets one non-Evoker ally be marked as brought by The Hanged Man', () => {
		const party = withBlessings(run(), ['hanged_man'])
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

	it('needs The Hanged Man and a run', () => {
		const runParty = run()
		expect(
			canMarkBroughtByBlessing(
				getExpedition(runParty)!,
				runParty.characters,
				runParty.characters[1]
			)
		).toBe(false)
		const buildParty = withBlessings(build(), ['hanged_man'])
		expect(
			canMarkBroughtByBlessing(
				getExpedition(buildParty)!,
				buildParty.characters,
				buildParty.characters[0]
			)
		).toBe(false)
	})
})

describe('unseal priority list', () => {
	it('splits sealed items into ranked and unranked', () => {
		const { ranked, unranked } = priorityLists(build())
		expect(ranked.map((e) => `${e.type}${e.position}`)).toEqual([
			'weapon4',
			'weapon7',
			'weapon3',
			'summon0'
		])
		expect(unranked.map((e) => `${e.type}${e.position}`)).toEqual([
			'weapon5',
			'weapon6',
			'weapon8',
			'summon1',
			'summon2',
			'summon3',
			'summon4',
			'summon5'
		])
	})

	it('is empty on runs', () => {
		expect(priorityLists(run())).toEqual({ ranked: [], unranked: [] })
	})

	it('ranks, reorders and unranks', () => {
		let lists = priorityLists(build())
		const summon1 = entryKey(lists.unranked.find((e) => e.type === 'summon' && e.position === 1)!)
		lists = rankAt(lists.ranked, lists.unranked, summon1, 0)
		expect(lists.ranked[0]?.position).toBe(1)
		expect(lists.unranked.some((e) => entryKey(e) === summon1)).toBe(false)

		// Move the last ranked item to the middle
		const last = entryKey(lists.ranked[lists.ranked.length - 1]!)
		lists = rankAt(lists.ranked, lists.unranked, last, 2)
		expect(entryKey(lists.ranked[2]!)).toBe(last)

		// Past the end appends
		const weapon5 = entryKey(lists.unranked[0]!)
		lists = rankAt(lists.ranked, lists.unranked, weapon5, 99)
		expect(entryKey(lists.ranked[lists.ranked.length - 1]!)).toBe(weapon5)

		lists = unrank(lists.ranked, lists.unranked, summon1)
		expect(lists.ranked.some((e) => entryKey(e) === summon1)).toBe(false)
		expect(lists.unranked.map((e) => `${e.type}${e.position}`)).toContain('summon1')
	})

	it('builds the PUT payload and applies it to the grid', () => {
		const party = build()
		const { ranked } = priorityLists(party)
		const payload = toPriorityPayload(ranked.slice(0, 2))
		expect(payload).toEqual([
			{ type: 'weapon', id: ranked[0]!.id },
			{ type: 'weapon', id: ranked[1]!.id }
		])
		const next = applyPriorities(party, payload)
		expect(next.weapons.find((w) => w.id === ranked[0]!.id)?.unsealPriority).toBe(1)
		expect(next.weapons.find((w) => w.id === ranked[2]!.id)?.unsealPriority).toBeNull()
		expect(next.summons.every((s) => s.unsealPriority == null)).toBe(true)
	})
})

describe('circledNumber', () => {
	it('uses circled digits up to 20', () => {
		expect(circledNumber(1)).toBe('①')
		expect(circledNumber(20)).toBe('⑳')
		expect(circledNumber(21)).toBe('21')
	})
})
