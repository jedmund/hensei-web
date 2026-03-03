import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GwAdapter } from '../gw.adapter'

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
			const mockEvents = [{ id: 'gw-1', eventNumber: 78 }]
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ gw_events: mockEvents })
			})

			const result = await adapter.getEvents()

			expect(result).toEqual(mockEvents)
		})

		it('should unwrap gwEvent from getEvent response', async () => {
			const mockEvent = { id: 'gw-1', eventNumber: 78 }
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ gw_event: mockEvent })
			})

			const result = await adapter.getEvent('gw-1')

			expect(result).toEqual(mockEvent)
		})

		it('should wrap body in gw_event for createEvent', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ gw_event: { id: 'gw-new' } })
			})
			const clearSpy = vi.spyOn(adapter as any, 'clearCache')

			await adapter.createEvent({ event_number: 79 } as any)

			const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
			expect(body.gw_event).toBeDefined()
			expect(clearSpy).toHaveBeenCalledWith('/gw_events')
		})
	})

	describe('participation', () => {
		it('should map getEventWithParticipation response', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					gw_event: { id: 'gw-1' },
					crew_gw_participation: { id: 'part-1' },
					members_during_event: [{ id: 'm1', retired: false }],
					phantom_players: [{ id: 'p1', name: 'Ghost', retired: true }]
				})
			})

			const result = await adapter.getEventWithParticipation('gw-1')

			expect(result.gwEvent).toEqual({ id: 'gw-1' })
			expect(result.participation).toEqual({ id: 'part-1' })
			expect(result.membersDuringEvent).toEqual([{ id: 'm1', retired: false }])
			expect(result.phantomPlayers).toEqual([{ id: 'p1', name: 'Ghost', retired: true }])
		})

		it('should default missing arrays to empty in getEventWithParticipation', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					gw_event: null,
					crew_gw_participation: null
					// membersDuringEvent and phantomPlayers missing
				})
			})

			const result = await adapter.getEventWithParticipation('gw-99')

			expect(result.gwEvent).toBeNull()
			expect(result.participation).toBeNull()
			expect(result.membersDuringEvent).toEqual([])
			expect(result.phantomPlayers).toEqual([])
		})

		it('should use number param in getEventWithParticipation URL', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					gw_event: null,
					crew_gw_participation: null
				})
			})

			await adapter.getEventWithParticipation(78)

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('/crew/gw_participations/by_event/78')
		})

		it('should unwrap participation from joinEvent and clear cache', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ participation: { id: 'part-1' } })
			})
			const clearSpy = vi.spyOn(adapter as any, 'clearCache')

			const result = await adapter.joinEvent('gw-1')

			expect(result).toEqual({ id: 'part-1' })
			expect(clearSpy).toHaveBeenCalledWith('/crew/gw_participations')
		})

		it('should unwrap crewGwParticipation from getParticipation', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ crew_gw_participation: { id: 'part-1', crewScores: [] } })
			})

			const result = await adapter.getParticipation('part-1')

			expect(result).toEqual({ id: 'part-1', crewScores: [] })
		})
	})

	describe('scores', () => {
		it('should POST addIndividualScoreByEvent to correct URL', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ individual_score: { id: 'is-1' } })
			})

			await adapter.addIndividualScoreByEvent('gw-1', { round: 1, score: 100000 } as any)

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('/crew/gw_events/gw-1/individual_scores')
			expect((global.fetch as any).mock.calls[0][1].method).toBe('POST')
		})

		it('should POST batchAddIndividualScoresByEvent to correct URL', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ individual_scores: [{ id: 'is-1' }] })
			})

			await adapter.batchAddIndividualScoresByEvent('gw-1', { scores: [] } as any)

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('/crew/gw_events/gw-1/individual_scores/batch')
			expect((global.fetch as any).mock.calls[0][1].method).toBe('POST')
		})

		it('should wrap body in crew_score for addCrewScore and clear participation cache', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ crew_score: { id: 'cs-1' } })
			})
			const clearSpy = vi.spyOn(adapter as any, 'clearCache')

			await adapter.addCrewScore('part-1', { round: 1, score: 500000 } as any)

			const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
			expect(body.crew_score).toBeDefined()
			expect(clearSpy).toHaveBeenCalledWith('/crew/gw_participations/part-1')
		})
	})
})
