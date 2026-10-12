import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SolomonisAdapter } from '../solomonis.adapter'
import { mockApiResponse } from './fixtures/helpers'
import routeEvokersFixture from './fixtures/solomonis/route-evokers.json'
import blessingsFixture from './fixtures/solomonis/blessings.json'
import partyRunFixture from './fixtures/solomonis/party-run.json'
import partyBuildFixture from './fixtures/solomonis/party-build.json'

const BASE = 'https://api.example.com'

function lastCall() {
	const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls
	const [url, init] = calls[calls.length - 1]!
	return { url: url as string, init: init as RequestInit }
}

describe('SolomonisAdapter', () => {
	let adapter: SolomonisAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new SolomonisAdapter({ baseURL: BASE })
	})

	afterEach(() => {
		global.fetch = originalFetch
	})

	describe('getRouteEvokers', () => {
		it('unwraps route_evokers and camelCases them', async () => {
			global.fetch = mockApiResponse(routeEvokersFixture)

			const result = await adapter.getRouteEvokers()

			expect(lastCall().url).toBe(`${BASE}/solomonis/route_evokers`)
			expect(result).toHaveLength(5)
			expect(result[2]).toEqual({
				id: 'c816c582-b04a-5173-982b-fa833919f4e6',
				granblueId: '3040169000',
				name: { en: 'Nier', ja: 'ニーア' },
				element: 5,
				zone: {
					id: 'bf7cd555-ac37-569c-91f4-f9836d04f695',
					slug: 'allotropic-microcosm',
					name: { en: 'Allotropic Microcosm', ja: null }
				}
			})
		})
	})

	describe('getBlessings', () => {
		it('returns the cost limit and blessings with camelCased levels', async () => {
			global.fetch = mockApiResponse(blessingsFixture)

			const result = await adapter.getBlessings()

			expect(lastCall().url).toBe(`${BASE}/solomonis/blessings`)
			expect(result.costLimit).toBe(100)
			const justice = result.blessings.find((b) => b.slug === 'justice')!
			expect(justice.arcanaNumber).toBe(11)
			expect(justice.released).toBe(true)
			expect(justice.levels[2]).toMatchObject({ level: 3, cost: 50, scintillas: 135100 })
			expect(result.blessings.some((b) => !b.released)).toBe(true)
		})
	})

	describe('party responses', () => {
		it('camelCases the full run expedition, including stats keys', async () => {
			global.fetch = mockApiResponse(partyRunFixture)

			const party = await adapter.updateExpedition(partyRunFixture.party.id, { pledgeLevel: 0 })
			const solomonis = party.solomonis as unknown as Record<string, unknown>

			expect(solomonis).toMatchObject({
				kind: 'run',
				routeEvoker: { granblueId: '3040169000' },
				bossesDefeated: 2,
				gameReportId: 381099,
				endedAt: '2026-10-11T16:38:00+09:00',
				buildParty: { shortcode: 'bld001', name: 'Nier starter' },
				blessingCostLimit: 100,
				blessingCostTotal: 50,
				stats: { shopPurchases: 18, pointsEarned: 2924, battle: 14 }
			})
			expect(party.weapons[0]).toMatchObject({ sealState: 'start', unsealPriority: null })
			expect(party.characters[0]).toMatchObject({ broughtByBlessing: false })
		})
	})

	describe('createParty', () => {
		it('POSTs the expedition under party[solomonis] in snake_case', async () => {
			global.fetch = mockApiResponse(partyBuildFixture)

			await adapter.createParty(
				{ name: 'Nier build' },
				{ kind: 'build', routeEvokerId: 'evoker-1', pledgeLevel: 2 }
			)

			const { url, init } = lastCall()
			expect(url).toBe(`${BASE}/parties`)
			expect(init.method).toBe('POST')
			expect(JSON.parse(init.body as string)).toEqual({
				party: {
					name: 'Nier build',
					solomonis: { kind: 'build', route_evoker_id: 'evoker-1', pledge_level: 2 }
				}
			})
		})
	})

	describe('updateExpedition', () => {
		it('PUTs party[solomonis] by party id, with the edit key header', async () => {
			global.fetch = mockApiResponse(partyRunFixture)

			await adapter.updateExpedition(
				'party-uuid',
				{ outcome: 'failed', bossesDefeated: 1, endedAt: null, buildPartyId: 'build-uuid' },
				{ 'X-Edit-Key': 'secret' }
			)

			const { url, init } = lastCall()
			expect(url).toBe(`${BASE}/parties/party-uuid`)
			expect(init.method).toBe('PUT')
			expect((init.headers as Record<string, string>)['X-Edit-Key']).toBe('secret')
			expect(JSON.parse(init.body as string)).toEqual({
				party: {
					solomonis: {
						outcome: 'failed',
						bosses_defeated: 1,
						ended_at: null,
						build_party_id: 'build-uuid'
					}
				}
			})
		})
	})

	describe('updateBlessings', () => {
		it('PUTs blessing_level_ids and returns the solomonis object', async () => {
			global.fetch = mockApiResponse({ solomonis: partyBuildFixture.party.solomonis })

			const result = await adapter.updateBlessings('party-uuid', ['level-a', 'level-b'])

			const { url, init } = lastCall()
			expect(url).toBe(`${BASE}/parties/party-uuid/blessings`)
			expect(init.method).toBe('PUT')
			expect(JSON.parse(init.body as string)).toEqual({
				blessing_level_ids: ['level-a', 'level-b']
			})
			expect(result.kind).toBe('build')
			expect(result.blessingCostTotal).toBe(70)
			expect(result.blessings.map((b) => b.blessing.slug)).toEqual(['justice', 'death'])
		})

		it('also accepts an unwrapped solomonis object', async () => {
			global.fetch = mockApiResponse(partyBuildFixture.party.solomonis)

			const result = await adapter.updateBlessings('party-uuid', [])

			expect(result.blessingCostLimit).toBe(100)
		})
	})
})
