import { describe, it, expect } from 'vitest'
import type { RaidFull } from '$lib/types/api/raid'
import { PartyVisibility } from '$lib/types/visibility'
import { partyEditValuesChanged, raidFullToRaid, type PartyEditValues } from '../partyEditValues'

const initial: PartyEditValues = {
	name: 'My team',
	description: null,
	visibility: PartyVisibility.PUBLIC,
	sharedWithCrew: false,
	fullAuto: false,
	solo: false,
	autoGuard: false,
	autoSummon: false,
	chargeAttack: true,
	clearTime: null,
	buttonCount: null,
	chainCount: null,
	summonCount: null,
	videoUrl: null,
	raid: null,
	raidId: null
}

describe('partyEditValuesChanged', () => {
	it('is false for identical values', () => {
		expect(partyEditValuesChanged(initial, { ...initial })).toBe(false)
	})

	it.each([
		['name', 'Renamed'],
		['description', '{"type":"doc"}'],
		['sharedWithCrew', true],
		['fullAuto', true],
		['solo', true],
		['autoGuard', true],
		['autoSummon', true],
		['chargeAttack', false],
		['clearTime', 90],
		['buttonCount', 2],
		['chainCount', 1],
		['summonCount', 3],
		['videoUrl', 'https://youtu.be/x'],
		['raidId', 'raid-1']
	] as const)('detects a change to %s', (field, value) => {
		expect(partyEditValuesChanged(initial, { ...initial, [field]: value })).toBe(true)
	})

	it('detects a visibility change', () => {
		expect(
			partyEditValuesChanged(initial, { ...initial, visibility: PartyVisibility.PRIVATE })
		).toBe(true)
	})

	it('tracks the raid by id, not by object identity', () => {
		const raid = raidFullToRaid({
			id: 'raid-1',
			slug: 'r',
			name: { en: 'R' },
			level: 1,
			element: 1,
			playerCount: 18,
			extra: false
		} as RaidFull)
		const before = { ...initial, raid, raidId: 'raid-1' }
		expect(partyEditValuesChanged(before, { ...before, raid: { ...raid } })).toBe(false)
	})
})

describe('raidFullToRaid', () => {
	const base = {
		id: 'raid-1',
		slug: 'lucilius',
		name: { en: 'Lucilius', ja: 'ルシファー' },
		level: 150,
		element: 6,
		playerCount: 6,
		extra: false,
		releasedAt: '2020-01-01'
	} satisfies RaidFull

	it('keeps the party-facing fields and drops the rest', () => {
		expect(raidFullToRaid(base)).toEqual({
			id: 'raid-1',
			slug: 'lucilius',
			name: { en: 'Lucilius', ja: 'ルシファー' },
			level: 150,
			element: 6,
			group: undefined,
			extra: false
		})
	})

	it('flattens the group, stringifying the section and filling defaults', () => {
		const raid = raidFullToRaid({
			...base,
			group: {
				id: 'g1',
				name: { en: 'Endgame' },
				section: 3,
				order: 1,
				difficulty: 5,
				hl: true,
				extra: false,
				guidebooks: true,
				unlimited: false
			}
		} as RaidFull)
		expect(raid.group).toEqual({
			id: 'g1',
			name: { en: 'Endgame' },
			section: '3',
			order: 1,
			difficulty: 5,
			hl: true,
			extra: false,
			guidebooks: true,
			unlimited: false,
			supportSummon: true,
			contentMode: null
		})
	})

	it('keeps an explicit supportSummon: false', () => {
		const raid = raidFullToRaid({
			...base,
			group: {
				id: 'g1',
				name: { en: 'Arcarum' },
				section: '1',
				order: 1,
				difficulty: 1,
				hl: false,
				extra: false,
				guidebooks: false,
				unlimited: false,
				supportSummon: false
			}
		} as RaidFull)
		expect(raid.group?.supportSummon).toBe(false)
	})
})
