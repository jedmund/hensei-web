import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GwAdapter } from '../gw.adapter'
import { API, EXPECTED } from './fixtures/gw.fixtures'
import { mockApiResponse } from './fixtures/helpers'

describe('GwAdapter', () => {
	let adapter: GwAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new GwAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	describe('events', () => {
		it('should unwrap gwEvents from getEvents response', async () => {
			global.fetch = mockApiResponse(API.getEvents)

			const result = await adapter.getEvents()

			expect(result).toEqual(EXPECTED.getEvents)
		})

		it('should unwrap gwEvent from getEvent response', async () => {
			global.fetch = mockApiResponse(API.getEvent)

			const result = await adapter.getEvent('gw-1')

			expect(result).toEqual(EXPECTED.getEvent)
		})

		it('should wrap body in gw_event for createEvent', async () => {
			global.fetch = mockApiResponse(API.createEvent)
			const clearSpy = vi.spyOn(adapter as any, 'clearCache')

			await adapter.createEvent({ event_number: 79 } as any)

			const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
			expect(body.gw_event).toBeDefined()
			expect(clearSpy).toHaveBeenCalledWith('/gw_events')
		})
	})

	describe('participation', () => {
		it('should map getEventWithParticipation response', async () => {
			global.fetch = mockApiResponse(API.getEventWithParticipation)

			const result = await adapter.getEventWithParticipation('gw-1')

			expect(result).toEqual(EXPECTED.getEventWithParticipation)
		})

		it('should default missing arrays to empty in getEventWithParticipation', async () => {
			global.fetch = mockApiResponse(API.getEventWithParticipationEmpty)

			const result = await adapter.getEventWithParticipation('gw-99')

			expect(result).toEqual(EXPECTED.getEventWithParticipationEmpty)
		})

		it('should use number param in getEventWithParticipation URL', async () => {
			global.fetch = mockApiResponse(API.getEventWithParticipationEmpty)

			await adapter.getEventWithParticipation(78)

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('/crew/gw_participations/by_event/78')
		})

		it('should unwrap participation from joinEvent and clear cache', async () => {
			global.fetch = mockApiResponse(API.joinEvent)
			const clearSpy = vi.spyOn(adapter as any, 'clearCache')

			const result = await adapter.joinEvent('gw-1')

			expect(result).toEqual(EXPECTED.joinEvent)
			expect(clearSpy).toHaveBeenCalledWith('/crew/gw_participations')
		})

		it('should unwrap crewGwParticipation from getParticipation', async () => {
			global.fetch = mockApiResponse(API.getParticipation)

			const result = await adapter.getParticipation('part-1')

			expect(result).toEqual(EXPECTED.getParticipation)
		})
	})

	describe('scores', () => {
		it('should POST addIndividualScoreByEvent to correct URL', async () => {
			global.fetch = mockApiResponse(API.addIndividualScore)

			await adapter.addIndividualScoreByEvent('gw-1', { round: 1, score: 100000 } as any)

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('/crew/gw_events/gw-1/individual_scores')
			expect((global.fetch as any).mock.calls[0][1].method).toBe('POST')
		})

		it('should POST batchAddIndividualScoresByEvent to correct URL', async () => {
			global.fetch = mockApiResponse(API.batchAddIndividualScores)

			await adapter.batchAddIndividualScoresByEvent('gw-1', { scores: [] } as any)

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('/crew/gw_events/gw-1/individual_scores/batch')
			expect((global.fetch as any).mock.calls[0][1].method).toBe('POST')
		})

		it('should wrap body in crew_score for addCrewScore and clear participation cache', async () => {
			global.fetch = mockApiResponse(API.addCrewScore)
			const clearSpy = vi.spyOn(adapter as any, 'clearCache')

			await adapter.addCrewScore('part-1', { round: 1, score: 500000 } as any)

			const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
			expect(body.crew_score).toBeDefined()
			expect(clearSpy).toHaveBeenCalledWith('/crew/gw_participations/part-1')
		})
	})
})
