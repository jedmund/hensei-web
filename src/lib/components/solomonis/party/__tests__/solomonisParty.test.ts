import { describe, it, expect } from 'vitest'
import {
	defaultRouteEvokerId,
	evokersInGrid,
	formatJst,
	hasStats,
	isFullExpedition,
	isSolomonisParty,
	releasedBlessings,
	routeEvokerMissingFromGrid,
	sameSelection,
	selectionCost,
	selectionFromParty,
	selectionToLevelIds,
	showGuidebookSection,
	solomonisName,
	spaceStats,
	totalSpaces
} from '../solomonisParty'
import type { Party } from '$lib/types/api/party'
import {
	BLESSINGS,
	BUILD_PARTY,
	FRAUX_ID,
	NIER_ID,
	ROUTE_EVOKERS,
	RUN_PARTY,
	blessingBySlug
} from './fixtures'

const catalogue = BLESSINGS.blessings

describe('isFullExpedition / isSolomonisParty', () => {
	it('tells the full view from the list summary', () => {
		expect(isFullExpedition(RUN_PARTY.solomonis)).toBe(true)
		expect(isFullExpedition({ routeEvokerId: NIER_ID, pledgeLevel: 0 })).toBe(false)
		expect(isFullExpedition(null)).toBe(false)
	})

	it('detects Solomonis parties by content mode or expedition', () => {
		expect(isSolomonisParty(RUN_PARTY)).toBe(true)
		const zoneOnly: Pick<Party, 'raid' | 'solomonis'> = {
			raid: {
				id: 'z',
				slug: 'allotropic-microcosm',
				name: { en: 'Allotropic Microcosm', ja: '' },
				level: 0,
				element: 0,
				extra: false,
				group: {
					id: 'g',
					name: { en: 'Evoking Solomonis', ja: '' },
					section: '3',
					order: 0,
					difficulty: 0,
					hl: false,
					extra: false,
					guidebooks: false,
					unlimited: false,
					contentMode: 'solomonis'
				}
			},
			solomonis: null
		}
		expect(isSolomonisParty(zoneOnly)).toBe(true)
		expect(isSolomonisParty({ raid: undefined, solomonis: null })).toBe(false)
	})
})

describe('solomonisName', () => {
	it('uses the locale and falls back to the other language', () => {
		expect(solomonisName({ en: 'Nier', ja: 'ニーア' }, 'ja')).toBe('ニーア')
		expect(solomonisName({ en: 'Allotropic Microcosm', ja: null }, 'ja')).toBe(
			'Allotropic Microcosm'
		)
		expect(solomonisName({ en: null, ja: '効果' }, 'en')).toBe('効果')
		expect(solomonisName({ en: null, ja: null }, 'en')).toBe('—')
		expect(solomonisName(null, 'en')).toBe('—')
	})
})

describe('JST dates', () => {
	it('formats timestamps in JST regardless of the input offset', () => {
		expect(formatJst('2026-10-11T16:38:00+09:00')).toBe('2026-10-11 16:38')
		expect(formatJst('2026-10-11T16:38:00Z')).toBe('2026-10-12 01:38')
		expect(formatJst(null)).toBeNull()
		expect(formatJst('nope')).toBeNull()
	})
})

describe('stats', () => {
	const run = isFullExpedition(RUN_PARTY.solomonis) ? RUN_PARTY.solomonis : null

	it('lists spaces in display order', () => {
		const stats = spaceStats(run!.stats)
		expect(stats.map((s) => s.key)).toEqual([
			'battle',
			'strong',
			'terrifying',
			'ruler',
			'boss',
			'event',
			'healing',
			'chest',
			'teleporter',
			'special'
		])
		expect(totalSpaces(run!.stats)).toBe(48)
	})

	it('treats an empty stats object (no report) as no stats', () => {
		const build = isFullExpedition(BUILD_PARTY.solomonis) ? BUILD_PARTY.solomonis : null
		expect(hasStats(build!.stats)).toBe(false)
		expect(hasStats(run!.stats)).toBe(true)
		expect(spaceStats({ battle: 3 })).toEqual([{ key: 'battle', count: 3 }])
	})
})

describe('blessing selection', () => {
	const justice = blessingBySlug('justice')
	const death = blessingBySlug('death')

	it('reads the party loadout and costs it from the catalogue', () => {
		const build = isFullExpedition(BUILD_PARTY.solomonis) ? BUILD_PARTY.solomonis : null
		const selection = selectionFromParty(build!.blessings)
		expect(selection).toEqual({
			[justice.id]: justice.levels[2]!.id,
			[death.id]: death.levels[8]!.id
		})
		expect(selectionCost(catalogue, selection)).toBe(build!.blessingCostTotal)
	})

	it('only offers released blessings, in arcana order', () => {
		const released = releasedBlessings(catalogue)
		expect(released.map((b) => b.slug)).toEqual([
			'justice',
			'hanged_man',
			'death',
			'temperance',
			'devil'
		])
	})

	it('sends level ids in arcana order and drops unknown or unreleased picks', () => {
		const unreleased = catalogue.find((b) => !b.released)!
		const selection = {
			[death.id]: death.levels[0]!.id,
			[justice.id]: justice.levels[1]!.id,
			[unreleased.id]: unreleased.levels[0]?.id ?? 'x',
			['missing']: 'y'
		}
		expect(selectionToLevelIds(catalogue, selection)).toEqual([
			justice.levels[1]!.id,
			death.levels[0]!.id
		])
	})

	it('compares selections by content', () => {
		expect(sameSelection({ a: '1', b: '2' }, { b: '2', a: '1' })).toBe(true)
		expect(sameSelection({ a: '1' }, { a: '1', b: '2' })).toBe(false)
	})
})

describe('route Evoker', () => {
	it('finds eligible Evokers in the grid', () => {
		expect(evokersInGrid(BUILD_PARTY, ROUTE_EVOKERS).map((e) => e.id)).toEqual([NIER_ID])
	})

	it('keeps the current route, else preselects the only Evoker in the grid', () => {
		expect(defaultRouteEvokerId(BUILD_PARTY, ROUTE_EVOKERS)).toBe(NIER_ID)
		const noExpedition = { ...BUILD_PARTY, solomonis: null }
		expect(defaultRouteEvokerId(noExpedition, ROUTE_EVOKERS)).toBe(NIER_ID)
	})

	it('asks when more than one Evoker is in the grid', () => {
		const fraux = ROUTE_EVOKERS.find((e) => e.id === FRAUX_ID)!
		const twoEvokers = {
			solomonis: null,
			characters: [
				...BUILD_PARTY.characters,
				{
					id: 'gc-2',
					position: 1,
					character: {
						id: fraux.id,
						granblueId: fraux.granblueId,
						name: { en: 'Fraux', ja: 'フラウ' }
					}
				}
			]
		} as unknown as Party
		expect(defaultRouteEvokerId(twoEvokers, ROUTE_EVOKERS)).toBeNull()
	})

	it('flags a route Evoker missing from the grid', () => {
		expect(routeEvokerMissingFromGrid(BUILD_PARTY)).toBe(false)
		expect(routeEvokerMissingFromGrid({ ...BUILD_PARTY, characters: [] })).toBe(true)
	})
})

describe('showGuidebookSection', () => {
	const expedition = RUN_PARTY.solomonis
	if (!isFullExpedition(expedition)) throw new Error('RUN_PARTY needs the full view')
	const empty = { ...expedition, guidebook: [] }

	it('shows an empty guidebook to editors, so they can add effects', () => {
		expect(showGuidebookSection(empty, true)).toBe(true)
	})

	it('hides an empty guidebook from viewers', () => {
		expect(showGuidebookSection(empty, false)).toBe(false)
	})

	it('shows a filled guidebook to everyone', () => {
		expect(expedition.guidebook.length).toBeGreaterThan(0)
		expect(showGuidebookSection(expedition, true)).toBe(true)
		expect(showGuidebookSection(expedition, false)).toBe(true)
	})
})
