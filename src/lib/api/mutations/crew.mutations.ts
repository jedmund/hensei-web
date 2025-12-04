/**
 * Crew Mutation Configurations
 *
 * Provides mutation configurations for crew CRUD operations
 * with cache invalidation using TanStack Query v6.
 *
 * @module api/mutations/crew
 */

import { useQueryClient, createMutation } from '@tanstack/svelte-query'
import { crewAdapter } from '$lib/api/adapters/crew.adapter'
import { crewKeys } from '$lib/api/queries/crew.queries'
import type {
  CreateCrewInput,
  UpdateCrewInput,
  CreatePhantomPlayerInput,
  UpdatePhantomPlayerInput,
  UpdateMembershipInput
} from '$lib/types/api/crew'

// ==================== Crew Mutations ====================

/**
 * Create crew mutation
 */
export function useCreateCrew() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: (input: CreateCrewInput) => crewAdapter.create(input),
    onSuccess: (crew) => {
      queryClient.setQueryData(crewKeys.myCrew(), crew)
      queryClient.invalidateQueries({ queryKey: crewKeys.invitations.pending() })
    }
  }))
}

/**
 * Update crew mutation
 */
export function useUpdateCrew() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: (input: UpdateCrewInput) => crewAdapter.update(input),
    onSuccess: (crew) => {
      queryClient.setQueryData(crewKeys.myCrew(), crew)
    }
  }))
}

/**
 * Leave crew mutation
 */
export function useLeaveCrew() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: () => crewAdapter.leave(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: crewKeys.myCrew() })
      queryClient.removeQueries({ queryKey: crewKeys.membersAll() })
    }
  }))
}

/**
 * Transfer captain mutation
 */
export function useTransferCaptain() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({ crewId, userId }: { crewId: string; userId: string }) =>
      crewAdapter.transferCaptain(crewId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewKeys.myCrew() })
      queryClient.invalidateQueries({ queryKey: crewKeys.membersAll() })
    }
  }))
}

// ==================== Membership Mutations ====================

/**
 * Update membership (promote/demote or update joined_at) mutation
 */
export function useUpdateMembership() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({
      crewId,
      membershipId,
      input
    }: {
      crewId: string
      membershipId: string
      input: UpdateMembershipInput
    }) => crewAdapter.updateMembership(crewId, membershipId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewKeys.membersAll() })
    }
  }))
}

/**
 * Remove member mutation
 */
export function useRemoveMember() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({ crewId, membershipId }: { crewId: string; membershipId: string }) =>
      crewAdapter.removeMember(crewId, membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewKeys.membersAll() })
      queryClient.invalidateQueries({ queryKey: crewKeys.myCrew() })
    }
  }))
}

// ==================== Invitation Mutations ====================

/**
 * Send invitation mutation
 */
export function useSendInvitation() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({ crewId, userId }: { crewId: string; userId: string }) =>
      crewAdapter.sendInvitation(crewId, userId),
    onSuccess: (_invitation, { crewId }) => {
      queryClient.invalidateQueries({ queryKey: crewKeys.crewInvitations(crewId) })
    }
  }))
}

/**
 * Accept invitation mutation
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: (invitationId: string) => crewAdapter.acceptInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewKeys.myCrew() })
      queryClient.invalidateQueries({ queryKey: crewKeys.invitations.pending() })
    }
  }))
}

/**
 * Reject invitation mutation
 */
export function useRejectInvitation() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: (invitationId: string) => crewAdapter.rejectInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewKeys.invitations.pending() })
    }
  }))
}

// ==================== Phantom Player Mutations ====================

/**
 * Create phantom player mutation
 */
export function useCreatePhantom() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({ crewId, input }: { crewId: string; input: CreatePhantomPlayerInput }) =>
      crewAdapter.createPhantom(crewId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewKeys.membersAll() })
    }
  }))
}

/**
 * Update phantom player mutation
 */
export function useUpdatePhantom() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({
      crewId,
      phantomId,
      input
    }: {
      crewId: string
      phantomId: string
      input: UpdatePhantomPlayerInput
    }) => crewAdapter.updatePhantom(crewId, phantomId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewKeys.membersAll() })
    }
  }))
}

/**
 * Delete phantom player mutation
 */
export function useDeletePhantom() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({ crewId, phantomId }: { crewId: string; phantomId: string }) =>
      crewAdapter.deletePhantom(crewId, phantomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewKeys.membersAll() })
    }
  }))
}

/**
 * Assign phantom player mutation
 */
export function useAssignPhantom() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({
      crewId,
      phantomId,
      userId
    }: {
      crewId: string
      phantomId: string
      userId: string
    }) => crewAdapter.assignPhantom(crewId, phantomId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewKeys.membersAll() })
    }
  }))
}

/**
 * Confirm phantom claim mutation
 */
export function useConfirmPhantomClaim() {
  const queryClient = useQueryClient()

  return createMutation(() => ({
    mutationFn: ({ crewId, phantomId }: { crewId: string; phantomId: string }) =>
      crewAdapter.confirmPhantomClaim(crewId, phantomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crewKeys.membersAll() })
    }
  }))
}
