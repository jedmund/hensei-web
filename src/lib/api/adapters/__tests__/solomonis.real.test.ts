/**
 * The Solomonis adapter and panel helpers against real API responses,
 * recorded by the api-endpoints lane (board fixtures/real). Each file is
 * `{ status, body }`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SolomonisAdapter } from '../solomonis.adapter'
import { mockApiResponse } from './fixtures/helpers'
import {
	formatJst,
	isFullExpedition,
	isSolomonisParty,
	releasedBlessings,
	solomonisErrorMessage,
	solomonisRaidTransition
} from '$lib/components/solomonis/party/solomonisParty'
import { transformResponse } from '$lib/api/schemas/transforms'
import type { Party } from '$lib/types/api/party'
import routeEvokers from './fixtures/solomonis/real/route-evokers.json'
import blessings from './fixtures/solomonis/real/blessings.json'
import partyRun from './fixtures/solomonis/real/party-run.json'
import putBlessings200 from './fixtures/solomonis/real/put-blessings-200.json'
import putBlessings422 from './fixtures/solomonis/real/put-blessings-422.json'
import enterZone422 from './fixtures/solomonis/real/put-party-enter-zone-422.json'
import postParty201 from './fixtures/solomonis/real/post-party-solomonis-201.json'

const BASE = 'https://api.example.com'

function mockApiError(status: number, body: unknown) {
	return vi.fn().mockResolvedValue({
		ok: false,
		status,
		statusText: 'Unprocessable Entity',
		json: async () => body
	})
}

describe('Solomonis adapter with real API responses', () => {
	let adapter: SolomonisAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new SolomonisAdapter({ baseURL: BASE, retries: 0 })
	})

	afterEach(() => {
		global.fetch = originalFetch
	})

	it('reads the route Evoker catalogue', async () => {
		global.fetch = mockApiResponse(routeEvokers.body)
		const result = await adapter.getRouteEvokers()
		expect(result.length).toBeGreaterThan(0)
		expect(result[0]).toMatchObject({
			granblueId: expect.any(String),
			element: expect.any(Number),
			zone: { slug: 'allotropic-microcosm' }
		})
	})

	it('offers only released blessings, even with an unreleased one without levels', async () => {
		global.fetch = mockApiResponse(blessings.body)
		const result = await adapter.getBlessings()
		expect(result.costLimit).toBe(100)
		expect(result.blessings.some((b) => !b.released)).toBe(true)
		expect(releasedBlessings(result.blessings).every((b) => b.released)).toBe(true)
	})

	it('takes the full party from the blessings write, with Justice opening position 2', async () => {
		global.fetch = mockApiResponse(putBlessings200.body)
		const party = await adapter.updateBlessings('party-uuid', [])
		expect(isFullExpedition(party.solomonis)).toBe(true)
		const position2 = party.weapons.find((w) => w.position === 2)
		expect(position2?.sealState).toBe('start')
	})

	it('takes the full party from a create with party[solomonis]', async () => {
		global.fetch = mockApiResponse(postParty201.body)
		const party = await adapter.createParty({}, { routeEvokerId: 'evoker' })
		expect(isFullExpedition(party.solomonis) && party.solomonis.kind).toBe('build')
	})

	it('shows a UTC ended_at in JST', () => {
		const party = partyRun.body.party
		expect(party.solomonis.ended_at).toBe('2026-10-11T07:38:00.000Z')
		expect(formatJst(party.solomonis.ended_at)).toBe('2026-10-11 16:38')
	})

	it('recognises a Solomonis zone from its raid group content mode', () => {
		const party = transformResponse<{ party: Party }>(partyRun.body).party
		expect(party.raid?.group?.contentMode).toBe('solomonis')
		expect(isSolomonisParty({ raid: party.raid, solomonis: null })).toBe(true)
		expect(solomonisRaidTransition(false, party.raid)).toBe('enter')
	})

	it('words the D12 error without the solomonis. key prefix', async () => {
		global.fetch = mockApiError(enterZone422.status, enterZone422.body)
		const error = await adapter.updateExpedition('party-uuid', {}).catch((e: unknown) => e)
		expect(solomonisErrorMessage(error, 'fallback')).toBe(
			'Route Evoker Id is required to enter an Evoking Solomonis zone'
		)
	})

	it('words the blessing errors', async () => {
		global.fetch = mockApiError(putBlessings422.status, putBlessings422.body)
		const error = await adapter.updateBlessings('party-uuid', []).catch((e: unknown) => e)
		expect(solomonisErrorMessage(error, 'fallback')).toBe(
			'Blessings can hold one level of each blessing, cost 120, over the limit of 100'
		)
	})
})
