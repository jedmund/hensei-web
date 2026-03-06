import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
	createGwEventOptions,
	updateGwEventOptions,
	joinGwEventOptions,
	updateParticipationRankingOptions,
	addCrewScoreOptions,
	updateCrewScoreOptions,
	addIndividualScoreOptions,
	batchAddIndividualScoresOptions,
	updateIndividualScoreOptions,
	deleteIndividualScoreOptions
} from '../gw.mutations'
import { createTestQueryClient } from './helpers'
import { gwKeys } from '$lib/api/queries/gw.queries'
import type { QueryClient } from '@tanstack/svelte-query'

vi.mock('$lib/api/adapters/gw.adapter', () => ({
	gwAdapter: {
		createEvent: vi.fn(),
		updateEvent: vi.fn(),
		joinEvent: vi.fn(),
		updateParticipationRanking: vi.fn(),
		addCrewScore: vi.fn(),
		updateCrewScore: vi.fn(),
		addIndividualScore: vi.fn(),
		batchAddIndividualScores: vi.fn(),
		updateIndividualScore: vi.fn(),
		deleteIndividualScore: vi.fn()
	}
}))

let queryClient: QueryClient

beforeEach(() => {
	queryClient = createTestQueryClient()
})

// ============================================================================
// Event Mutations
// ============================================================================

describe('createGwEventOptions', () => {
	it('invalidates events list on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = createGwEventOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(gwKeys.events())
	})
})

describe('updateGwEventOptions', () => {
	it('invalidates events list and specific event on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updateGwEventOptions(queryClient)

		opts.onSuccess(undefined, { eventId: 'gw-1', input: {} as any })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(gwKeys.events())
		expect(keys).toContainEqual(gwKeys.event('gw-1'))
	})
})

// ============================================================================
// Participation Mutations
// ============================================================================

describe('joinGwEventOptions', () => {
	it('invalidates all participations on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = joinGwEventOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(gwKeys.participationsAll())
	})
})

describe('updateParticipationRankingOptions', () => {
	it('invalidates all participations and specific participation on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updateParticipationRankingOptions(queryClient)

		opts.onSuccess(undefined, { participationId: 'part-1', input: {} as any })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(gwKeys.participationsAll())
		expect(keys).toContainEqual(gwKeys.participation('part-1'))
	})
})

// ============================================================================
// Crew Score Mutations
// ============================================================================

describe('addCrewScoreOptions', () => {
	it('invalidates specific participation on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = addCrewScoreOptions(queryClient)

		opts.onSuccess(undefined, { participationId: 'part-1', input: {} as any })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(gwKeys.participation('part-1'))
	})
})

describe('updateCrewScoreOptions', () => {
	it('invalidates specific participation on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updateCrewScoreOptions(queryClient)

		opts.onSuccess(undefined, { participationId: 'part-1', scoreId: 's-1', input: {} as any })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(gwKeys.participation('part-1'))
	})
})

// ============================================================================
// Individual Score Mutations
// ============================================================================

describe('addIndividualScoreOptions', () => {
	it('invalidates specific participation on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = addIndividualScoreOptions(queryClient)

		opts.onSuccess(undefined, { participationId: 'part-1', input: {} as any })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(gwKeys.participation('part-1'))
	})
})

describe('batchAddIndividualScoresOptions', () => {
	it('invalidates specific participation on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = batchAddIndividualScoresOptions(queryClient)

		opts.onSuccess(undefined, { participationId: 'part-1', input: {} as any })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(gwKeys.participation('part-1'))
	})
})

describe('updateIndividualScoreOptions', () => {
	it('invalidates specific participation on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updateIndividualScoreOptions(queryClient)

		opts.onSuccess(undefined, { participationId: 'part-1', scoreId: 's-1', input: {} as any })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(gwKeys.participation('part-1'))
	})
})

describe('deleteIndividualScoreOptions', () => {
	it('invalidates specific participation on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = deleteIndividualScoreOptions(queryClient)

		opts.onSuccess(undefined, { participationId: 'part-1', scoreId: 's-1' })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(gwKeys.participation('part-1'))
	})
})
