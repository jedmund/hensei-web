/**
 * Crew Mutation Configurations
 *
 * Provides mutation configurations for crew CRUD operations
 * with cache invalidation using TanStack Query v6.
 *
 * Each mutation exports both an options factory (for testing) and a hook (for components).
 *
 * @module api/mutations/crew
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { crewAdapter } from '$lib/api/adapters/crew.adapter'
import { crewKeys } from '$lib/api/queries/crew.queries'
import type {
	CreateCrewInput,
	UpdateCrewInput,
	CreatePhantomPlayerInput,
	UpdatePhantomPlayerInput,
	UpdateMembershipInput
} from '$lib/types/api/crew'

// ============================================================================
// Options Factories — Crew CRUD
// ============================================================================

export function createCrewOptions(queryClient: QueryClient) {
	return {
		mutationFn: (input: CreateCrewInput) => crewAdapter.create(input),
		onSuccess: (crew: any) => {
			queryClient.setQueryData(crewKeys.myCrew(), crew)
			queryClient.invalidateQueries({ queryKey: crewKeys.invitations.pending() })
		}
	}
}

export function updateCrewOptions(queryClient: QueryClient) {
	return {
		mutationFn: (input: UpdateCrewInput) => crewAdapter.update(input),
		onSuccess: (crew: any) => {
			queryClient.setQueryData(crewKeys.myCrew(), crew)
		}
	}
}

export function leaveCrewOptions(queryClient: QueryClient) {
	return {
		mutationFn: () => crewAdapter.leave(),
		onSuccess: () => {
			queryClient.removeQueries({ queryKey: crewKeys.myCrew() })
			queryClient.removeQueries({ queryKey: crewKeys.membersAll() })
		}
	}
}

export function transferCaptainOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ crewId, userId }: { crewId: string; userId: string }) =>
			crewAdapter.transferCaptain(crewId, userId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: crewKeys.myCrew() })
			queryClient.invalidateQueries({ queryKey: crewKeys.membersAll() })
		}
	}
}

// ============================================================================
// Options Factories — Membership
// ============================================================================

export function updateMembershipOptions(queryClient: QueryClient) {
	return {
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
	}
}

export function removeMemberOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ crewId, membershipId }: { crewId: string; membershipId: string }) =>
			crewAdapter.removeMember(crewId, membershipId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: crewKeys.membersAll() })
			queryClient.invalidateQueries({ queryKey: crewKeys.myCrew() })
		}
	}
}

// ============================================================================
// Options Factories — Invitations
// ============================================================================

export function sendInvitationOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ crewId, userId }: { crewId: string; userId: string }) =>
			crewAdapter.sendInvitation(crewId, userId),
		onSuccess: (_invitation: unknown, { crewId }: { crewId: string; userId: string }) => {
			queryClient.invalidateQueries({ queryKey: crewKeys.crewInvitations(crewId) })
		}
	}
}

export function acceptInvitationOptions(queryClient: QueryClient) {
	return {
		mutationFn: (invitationId: string) => crewAdapter.acceptInvitation(invitationId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: crewKeys.myCrew() })
			queryClient.invalidateQueries({ queryKey: crewKeys.invitations.pending() })
		}
	}
}

export function rejectInvitationOptions(queryClient: QueryClient) {
	return {
		mutationFn: (invitationId: string) => crewAdapter.rejectInvitation(invitationId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: crewKeys.invitations.pending() })
		}
	}
}

// ============================================================================
// Options Factories — Phantom Players
// ============================================================================

export function createPhantomOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ crewId, input }: { crewId: string; input: CreatePhantomPlayerInput }) =>
			crewAdapter.createPhantom(crewId, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: crewKeys.membersAll() })
		}
	}
}

export function bulkCreatePhantomsOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ crewId, phantoms }: { crewId: string; phantoms: CreatePhantomPlayerInput[] }) =>
			crewAdapter.bulkCreatePhantoms(crewId, phantoms),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: crewKeys.membersAll() })
		}
	}
}

export function updatePhantomOptions(queryClient: QueryClient) {
	return {
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
	}
}

export function deletePhantomOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ crewId, phantomId }: { crewId: string; phantomId: string }) =>
			crewAdapter.deletePhantom(crewId, phantomId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: crewKeys.membersAll() })
		}
	}
}

export function assignPhantomOptions(queryClient: QueryClient) {
	return {
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
	}
}

export function confirmPhantomClaimOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ crewId, phantomId }: { crewId: string; phantomId: string }) =>
			crewAdapter.confirmPhantomClaim(crewId, phantomId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: crewKeys.membersAll() })
			queryClient.invalidateQueries({ queryKey: crewKeys.phantomClaims.pending() })
		}
	}
}

export function declinePhantomClaimOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ crewId, phantomId }: { crewId: string; phantomId: string }) =>
			crewAdapter.declinePhantomClaim(crewId, phantomId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: crewKeys.membersAll() })
			queryClient.invalidateQueries({ queryKey: crewKeys.phantomClaims.pending() })
		}
	}
}

// ============================================================================
// Hooks (thin wrappers for component use)
// ============================================================================

export function useCreateCrew() {
	const queryClient = useQueryClient()
	return createMutation(() => createCrewOptions(queryClient))
}

export function useUpdateCrew() {
	const queryClient = useQueryClient()
	return createMutation(() => updateCrewOptions(queryClient))
}

export function useLeaveCrew() {
	const queryClient = useQueryClient()
	return createMutation(() => leaveCrewOptions(queryClient))
}

export function useTransferCaptain() {
	const queryClient = useQueryClient()
	return createMutation(() => transferCaptainOptions(queryClient))
}

export function useUpdateMembership() {
	const queryClient = useQueryClient()
	return createMutation(() => updateMembershipOptions(queryClient))
}

export function useRemoveMember() {
	const queryClient = useQueryClient()
	return createMutation(() => removeMemberOptions(queryClient))
}

export function useSendInvitation() {
	const queryClient = useQueryClient()
	return createMutation(() => sendInvitationOptions(queryClient))
}

export function useAcceptInvitation() {
	const queryClient = useQueryClient()
	return createMutation(() => acceptInvitationOptions(queryClient))
}

export function useRejectInvitation() {
	const queryClient = useQueryClient()
	return createMutation(() => rejectInvitationOptions(queryClient))
}

export function useCreatePhantom() {
	const queryClient = useQueryClient()
	return createMutation(() => createPhantomOptions(queryClient))
}

export function useBulkCreatePhantoms() {
	const queryClient = useQueryClient()
	return createMutation(() => bulkCreatePhantomsOptions(queryClient))
}

export function useUpdatePhantom() {
	const queryClient = useQueryClient()
	return createMutation(() => updatePhantomOptions(queryClient))
}

export function useDeletePhantom() {
	const queryClient = useQueryClient()
	return createMutation(() => deletePhantomOptions(queryClient))
}

export function useAssignPhantom() {
	const queryClient = useQueryClient()
	return createMutation(() => assignPhantomOptions(queryClient))
}

export function useConfirmPhantomClaim() {
	const queryClient = useQueryClient()
	return createMutation(() => confirmPhantomClaimOptions(queryClient))
}

export function useDeclinePhantomClaim() {
	const queryClient = useQueryClient()
	return createMutation(() => declinePhantomClaimOptions(queryClient))
}
