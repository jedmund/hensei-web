/**
 * GW (Guild War) Mutation Configurations
 *
 * Provides mutation configurations for GW operations
 * with cache invalidation using TanStack Query v6.
 *
 * @module api/mutations/gw
 */

import { useQueryClient, createMutation } from '@tanstack/svelte-query'
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

// ==================== Event Mutations (Admin) ====================

/**
 * Create GW event mutation (admin only)
 */
export function useCreateGwEvent() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: (input: CreateGwEventInput) => gwAdapter.createEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gwKeys.events() })
    }
  }))
}

/**
 * Update GW event mutation (admin only)
 */
export function useUpdateGwEvent() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({ eventId, input }: { eventId: string; input: UpdateGwEventInput }) =>
      gwAdapter.updateEvent(eventId, input),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: gwKeys.events() })
      queryClient.invalidateQueries({ queryKey: gwKeys.event(eventId) })
    }
  }))
}

// ==================== Participation Mutations ====================

/**
 * Join GW event mutation
 */
export function useJoinGwEvent() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: (eventId: string) => gwAdapter.joinEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gwKeys.participationsAll() })
    }
  }))
}

/**
 * Update participation ranking mutation
 */
export function useUpdateParticipationRanking() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({
      participationId,
      input
    }: {
      participationId: string
      input: UpdateParticipationRankingInput
    }) => gwAdapter.updateParticipationRanking(participationId, input),
    onSuccess: (_data, { participationId }) => {
      queryClient.invalidateQueries({ queryKey: gwKeys.participationsAll() })
      queryClient.invalidateQueries({ queryKey: gwKeys.participation(participationId) })
    }
  }))
}

// ==================== Crew Score Mutations ====================

/**
 * Add crew score mutation
 */
export function useAddCrewScore() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({
      participationId,
      input
    }: {
      participationId: string
      input: CreateCrewScoreInput
    }) => gwAdapter.addCrewScore(participationId, input),
    onSuccess: (_data, { participationId }) => {
      queryClient.invalidateQueries({ queryKey: gwKeys.participation(participationId) })
    }
  }))
}

/**
 * Update crew score mutation
 */
export function useUpdateCrewScore() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({
      participationId,
      scoreId,
      input
    }: {
      participationId: string
      scoreId: string
      input: UpdateCrewScoreInput
    }) => gwAdapter.updateCrewScore(participationId, scoreId, input),
    onSuccess: (_data, { participationId }) => {
      queryClient.invalidateQueries({ queryKey: gwKeys.participation(participationId) })
    }
  }))
}

// ==================== Individual Score Mutations ====================

/**
 * Add individual score mutation
 */
export function useAddIndividualScore() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({
      participationId,
      input
    }: {
      participationId: string
      input: CreateIndividualScoreInput
    }) => gwAdapter.addIndividualScore(participationId, input),
    onSuccess: (_data, { participationId }) => {
      queryClient.invalidateQueries({ queryKey: gwKeys.participation(participationId) })
    }
  }))
}

/**
 * Batch add individual scores mutation
 */
export function useBatchAddIndividualScores() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({
      participationId,
      input
    }: {
      participationId: string
      input: BatchIndividualScoresInput
    }) => gwAdapter.batchAddIndividualScores(participationId, input),
    onSuccess: (_data, { participationId }) => {
      queryClient.invalidateQueries({ queryKey: gwKeys.participation(participationId) })
    }
  }))
}

/**
 * Update individual score mutation
 */
export function useUpdateIndividualScore() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({
      participationId,
      scoreId,
      input
    }: {
      participationId: string
      scoreId: string
      input: Partial<CreateIndividualScoreInput>
    }) => gwAdapter.updateIndividualScore(participationId, scoreId, input),
    onSuccess: (_data, { participationId }) => {
      queryClient.invalidateQueries({ queryKey: gwKeys.participation(participationId) })
    }
  }))
}

/**
 * Delete individual score mutation
 */
export function useDeleteIndividualScore() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({ participationId, scoreId }: { participationId: string; scoreId: string }) =>
      gwAdapter.deleteIndividualScore(participationId, scoreId),
    onSuccess: (_data, { participationId }) => {
      queryClient.invalidateQueries({ queryKey: gwKeys.participation(participationId) })
    }
  }))
}
