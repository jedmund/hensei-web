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
				routeEvoker: { granblueId: '3040169000' },
				outcome: 'cleared',
				gameReportId: 381099,
				endedAt: '2026-10-11T16:38:00+09:00',
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
				{ routeEvokerId: 'evoker-1', pledgeLevel: 2 }
			)

			const { url, init } = lastCall()
			expect(url).toBe(`${BASE}/parties`)
			expect(init.method).toBe('POST')
			expect(JSON.parse(init.body as string)).toEqual({
				party: {
					name: 'Nier build',
					solomonis: { route_evoker_id: 'evoker-1', pledge_level: 2 }
				}
			})
		})
	})

	describe('updateExpedition', () => {
		it('PUTs party[solomonis] by party id, with the edit key header', async () => {
			global.fetch = mockApiResponse(partyRunFixture)

			await adapter.updateExpedition(
				'party-uuid',
				{ outcome: 'miasma_2', pledgeLevel: 3 },
				{ 'X-Edit-Key': 'secret' }
			)

			const { url, init } = lastCall()
			expect(url).toBe(`${BASE}/parties/party-uuid`)
			expect(init.method).toBe('PUT')
			expect((init.headers as Record<string, string>)['X-Edit-Key']).toBe('secret')
			expect(JSON.parse(init.body as string)).toEqual({
				party: {
					solomonis: {
						outcome: 'miasma_2',
						pledge_level: 3
					}
				}
			})
		})
	})

	describe('updateBlessings', () => {
		it('PUTs blessing_level_ids and returns the full party (D11)', async () => {
			global.fetch = mockApiResponse(partyBuildFixture)

			const party = await adapter.updateBlessings('party-uuid', ['level-a', 'level-b'], {
				'X-Edit-Key': 'secret'
			})

			const { url, init } = lastCall()
			expect(url).toBe(`${BASE}/parties/party-uuid/blessings`)
			expect(init.method).toBe('PUT')
			expect((init.headers as Record<string, string>)['X-Edit-Key']).toBe('secret')
			expect(JSON.parse(init.body as string)).toEqual({
				blessing_level_ids: ['level-a', 'level-b']
			})
			expect(party.shortcode).toBe('bld001')
			const solomonis = party.solomonis as unknown as Record<string, unknown>
			expect(solomonis).toMatchObject({ outcome: null, blessingCostTotal: 70 })
			expect(party.weapons[0]).toMatchObject({ sealState: 'start' })
		})
	})
})
