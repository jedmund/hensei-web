/**
 * GW (Guild War) Mutation Configurations
 *
 * Provides mutation configurations for GW operations
 * with cache invalidation using TanStack Query v6.
 *
 * Each mutation exports both an options factory (for testing) and a hook (for components).
 *
 * @module api/mutations/gw
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { gwAdapter } from '$lib/api/adapters/gw.adapter'
import { gwKeys } from '$lib/api/queries/gw.queries'
import type {
	CreateGwEventInput,
	UpdateGwEventInput,
	UpdateParticipationRankingInput,
	CreateCrewScoreInput,
	UpdateCrewScoreInput,
	CreateIndividualScoreInput,
	BatchIndividualScoresInput
} from '$lib/types/api/gw'

// ============================================================================
// Options Factories — Events (Admin)
// ============================================================================

export function createGwEventOptions(queryClient: QueryClient) {
	return {
		mutationFn: (input: CreateGwEventInput) => gwAdapter.createEvent(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: gwKeys.events() })
		}
	}
}

export function updateGwEventOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ eventId, input }: { eventId: string; input: UpdateGwEventInput }) =>
			gwAdapter.updateEvent(eventId, input),
		onSuccess: (_data: unknown, { eventId }: { eventId: string; input: UpdateGwEventInput }) => {
			queryClient.invalidateQueries({ queryKey: gwKeys.events() })
			queryClient.invalidateQueries({ queryKey: gwKeys.event(eventId) })
		}
	}
}

// ============================================================================
// Options Factories — Participation
// ============================================================================

export function joinGwEventOptions(queryClient: QueryClient) {
	return {
		mutationFn: (eventId: string) => gwAdapter.joinEvent(eventId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: gwKeys.participationsAll() })
		}
	}
}

export function updateParticipationRankingOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			participationId,
			input
		}: {
			participationId: string
			input: UpdateParticipationRankingInput
		}) => gwAdapter.updateParticipationRanking(participationId, input),
		onSuccess: (
			_data: unknown,
			{ participationId }: { participationId: string; input: UpdateParticipationRankingInput }
		) => {
			queryClient.invalidateQueries({ queryKey: gwKeys.participationsAll() })
			queryClient.invalidateQueries({ queryKey: gwKeys.participation(participationId) })
		}
	}
}

// ============================================================================
// Options Factories — Crew Scores
// ============================================================================

export function addCrewScoreOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			participationId,
			input
		}: {
			participationId: string
			input: CreateCrewScoreInput
		}) => gwAdapter.addCrewScore(participationId, input),
		onSuccess: (
			_data: unknown,
			{ participationId }: { participationId: string; input: CreateCrewScoreInput }
		) => {
			queryClient.invalidateQueries({ queryKey: gwKeys.participation(participationId) })
		}
	}
}

export function updateCrewScoreOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			participationId,
			scoreId,
			input
		}: {
			participationId: string
			scoreId: string
			input: UpdateCrewScoreInput
		}) => gwAdapter.updateCrewScore(participationId, scoreId, input),
		onSuccess: (
			_data: unknown,
			{ participationId }: { participationId: string; scoreId: string; input: UpdateCrewScoreInput }
		) => {
			queryClient.invalidateQueries({ queryKey: gwKeys.participation(participationId) })
		}
	}
}

// ============================================================================
// Options Factories — Individual Scores
// ============================================================================

export function addIndividualScoreOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			participationId,
			input
		}: {
			participationId: string
			input: CreateIndividualScoreInput
		}) => gwAdapter.addIndividualScore(participationId, input),
		onSuccess: (
			_data: unknown,
			{ participationId }: { participationId: string; input: CreateIndividualScoreInput }
		) => {
			queryClient.invalidateQueries({ queryKey: gwKeys.participation(participationId) })
		}
	}
}

export function batchAddIndividualScoresOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			participationId,
			input
		}: {
			participationId: string
			input: BatchIndividualScoresInput
		}) => gwAdapter.batchAddIndividualScores(participationId, input),
		onSuccess: (
			_data: unknown,
			{ participationId }: { participationId: string; input: BatchIndividualScoresInput }
		) => {
			queryClient.invalidateQueries({ queryKey: gwKeys.participation(participationId) })
		}
	}
}

export function updateIndividualScoreOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			participationId,
			scoreId,
			input
		}: {
			participationId: string
			scoreId: string
			input: Partial<CreateIndividualScoreInput>
		}) => gwAdapter.updateIndividualScore(participationId, scoreId, input),
		onSuccess: (
			_data: unknown,
			{ participationId }: { participationId: string; scoreId: string; input: Partial<CreateIndividualScoreInput> }
		) => {
			queryClient.invalidateQueries({ queryKey: gwKeys.participation(participationId) })
		}
	}
}

export function deleteIndividualScoreOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ participationId, scoreId }: { participationId: string; scoreId: string }) =>
			gwAdapter.deleteIndividualScore(participationId, scoreId),
		onSuccess: (
			_data: unknown,
			{ participationId }: { participationId: string; scoreId: string }
		) => {
			queryClient.invalidateQueries({ queryKey: gwKeys.participation(participationId) })
		}
	}
}

// ============================================================================
// Hooks (thin wrappers for component use)
// ============================================================================

export function useCreateGwEvent() {
	const queryClient = useQueryClient()
	return createMutation(() => createGwEventOptions(queryClient))
}

export function useUpdateGwEvent() {
	const queryClient = useQueryClient()
	return createMutation(() => updateGwEventOptions(queryClient))
}

export function useJoinGwEvent() {
	const queryClient = useQueryClient()
	return createMutation(() => joinGwEventOptions(queryClient))
}

export function useUpdateParticipationRanking() {
	const queryClient = useQueryClient()
	return createMutation(() => updateParticipationRankingOptions(queryClient))
}

export function useAddCrewScore() {
	const queryClient = useQueryClient()
	return createMutation(() => addCrewScoreOptions(queryClient))
}

export function useUpdateCrewScore() {
	const queryClient = useQueryClient()
	return createMutation(() => updateCrewScoreOptions(queryClient))
}

export function useAddIndividualScore() {
	const queryClient = useQueryClient()
	return createMutation(() => addIndividualScoreOptions(queryClient))
}

export function useBatchAddIndividualScores() {
	const queryClient = useQueryClient()
	return createMutation(() => batchAddIndividualScoresOptions(queryClient))
}

export function useUpdateIndividualScore() {
	const queryClient = useQueryClient()
	return createMutation(() => updateIndividualScoreOptions(queryClient))
}

export function useDeleteIndividualScore() {
	const queryClient = useQueryClient()
	return createMutation(() => deleteIndividualScoreOptions(queryClient))
}
