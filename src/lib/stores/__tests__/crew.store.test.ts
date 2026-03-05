import { describe, it, expect, beforeEach } from 'vitest'
import type { Crew, CrewMembership, CrewInvitation } from '$lib/types/api/crew'

// Dynamic import to ensure Svelte Vite plugin transforms $state runes
const { crewStore } = await import('../crew.store.svelte')

// ============================================================================
// Helpers
// ============================================================================

function makeCrew(overrides: Partial<Crew> = {}): Crew {
	return {
		id: 'crew-1',
		name: 'Test Crew',
		gamertag: null,
		granblueCrewId: null,
		description: null,
		createdAt: '2024-01-01T00:00:00Z',
		...overrides
	} as Crew
}

function makeMembership(role: 'captain' | 'vice_captain' | 'member'): CrewMembership {
	return {
		id: 'mem-1',
		role,
		retired: false,
		retiredAt: null,
		joinedAt: '2024-01-01T00:00:00Z',
		createdAt: '2024-01-01T00:00:00Z'
	} as CrewMembership
}

function makeInvitation(id: string): CrewInvitation {
	return {
		id,
		status: 'pending',
		expiresAt: '2025-01-01T00:00:00Z',
		createdAt: '2024-01-01T00:00:00Z'
	} as CrewInvitation
}

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
	crewStore.clear()
})

// ============================================================================
// Computed roles
// ============================================================================

describe('computed roles', () => {
	it('isInCrew is false when no crew', () => {
		expect(crewStore.isInCrew).toBe(false)
	})

	it('isInCrew is true when crew is set', () => {
		crewStore.setCrew(makeCrew())
		expect(crewStore.isInCrew).toBe(true)
	})

	it('isCaptain when role is captain', () => {
		crewStore.setCrew(makeCrew(), makeMembership('captain'))
		expect(crewStore.isCaptain).toBe(true)
		expect(crewStore.isViceCaptain).toBe(false)
		expect(crewStore.isMember).toBe(false)
	})

	it('isViceCaptain when role is vice_captain', () => {
		crewStore.setCrew(makeCrew(), makeMembership('vice_captain'))
		expect(crewStore.isViceCaptain).toBe(true)
		expect(crewStore.isCaptain).toBe(false)
		expect(crewStore.isMember).toBe(false)
	})

	it('isMember when role is member', () => {
		crewStore.setCrew(makeCrew(), makeMembership('member'))
		expect(crewStore.isMember).toBe(true)
		expect(crewStore.isCaptain).toBe(false)
		expect(crewStore.isViceCaptain).toBe(false)
	})

	it('isOfficer is true for captain', () => {
		crewStore.setCrew(makeCrew(), makeMembership('captain'))
		expect(crewStore.isOfficer).toBe(true)
	})

	it('isOfficer is true for vice_captain', () => {
		crewStore.setCrew(makeCrew(), makeMembership('vice_captain'))
		expect(crewStore.isOfficer).toBe(true)
	})

	it('isOfficer is false for member', () => {
		crewStore.setCrew(makeCrew(), makeMembership('member'))
		expect(crewStore.isOfficer).toBe(false)
	})
})

// ============================================================================
// Permission getters
// ============================================================================

describe('permission getters', () => {
	it('captain has all management permissions', () => {
		crewStore.setCrew(makeCrew(), makeMembership('captain'))
		expect(crewStore.canManageMembers).toBe(true)
		expect(crewStore.canEditCrew).toBe(true)
		expect(crewStore.canTransferCaptain).toBe(true)
		expect(crewStore.canManagePhantoms).toBe(true)
		expect(crewStore.canRecordOthersScores).toBe(true)
	})

	it('captain cannot leave crew', () => {
		crewStore.setCrew(makeCrew(), makeMembership('captain'))
		expect(crewStore.canLeaveCrew).toBe(false)
	})

	it('vice_captain has management but not transfer', () => {
		crewStore.setCrew(makeCrew(), makeMembership('vice_captain'))
		expect(crewStore.canManageMembers).toBe(true)
		expect(crewStore.canEditCrew).toBe(true)
		expect(crewStore.canTransferCaptain).toBe(false)
		expect(crewStore.canManagePhantoms).toBe(true)
		expect(crewStore.canRecordOthersScores).toBe(true)
		expect(crewStore.canLeaveCrew).toBe(true)
	})

	it('member has no management permissions', () => {
		crewStore.setCrew(makeCrew(), makeMembership('member'))
		expect(crewStore.canManageMembers).toBe(false)
		expect(crewStore.canEditCrew).toBe(false)
		expect(crewStore.canTransferCaptain).toBe(false)
		expect(crewStore.canManagePhantoms).toBe(false)
		expect(crewStore.canRecordOthersScores).toBe(false)
		expect(crewStore.canLeaveCrew).toBe(true)
	})

	it('no crew means no permissions', () => {
		expect(crewStore.canManageMembers).toBe(false)
		expect(crewStore.canLeaveCrew).toBe(false)
		expect(crewStore.canTransferCaptain).toBe(false)
	})
})

// ============================================================================
// canActOnMember
// ============================================================================

describe('canActOnMember', () => {
	it('captain can act on member', () => {
		crewStore.setCrew(makeCrew(), makeMembership('captain'))
		expect(crewStore.canActOnMember('member')).toBe(true)
	})

	it('captain can act on vice_captain', () => {
		crewStore.setCrew(makeCrew(), makeMembership('captain'))
		expect(crewStore.canActOnMember('vice_captain')).toBe(true)
	})

	it('captain can act on captain', () => {
		crewStore.setCrew(makeCrew(), makeMembership('captain'))
		expect(crewStore.canActOnMember('captain')).toBe(true)
	})

	it('vice_captain can act on member', () => {
		crewStore.setCrew(makeCrew(), makeMembership('vice_captain'))
		expect(crewStore.canActOnMember('member')).toBe(true)
	})

	it('vice_captain cannot act on vice_captain', () => {
		crewStore.setCrew(makeCrew(), makeMembership('vice_captain'))
		expect(crewStore.canActOnMember('vice_captain')).toBe(false)
	})

	it('vice_captain cannot act on captain', () => {
		crewStore.setCrew(makeCrew(), makeMembership('vice_captain'))
		expect(crewStore.canActOnMember('captain')).toBe(false)
	})

	it('member cannot act on anyone', () => {
		crewStore.setCrew(makeCrew(), makeMembership('member'))
		expect(crewStore.canActOnMember('member')).toBe(false)
		expect(crewStore.canActOnMember('vice_captain')).toBe(false)
		expect(crewStore.canActOnMember('captain')).toBe(false)
	})
})

// ============================================================================
// canPromoteTo / canDemote
// ============================================================================

describe('canPromoteTo', () => {
	it('captain can promote to vice_captain', () => {
		crewStore.setCrew(makeCrew(), makeMembership('captain'))
		expect(crewStore.canPromoteTo('vice_captain')).toBe(true)
	})

	it('nobody can promote to captain', () => {
		crewStore.setCrew(makeCrew(), makeMembership('captain'))
		expect(crewStore.canPromoteTo('captain')).toBe(false)
	})

	it('vice_captain cannot promote', () => {
		crewStore.setCrew(makeCrew(), makeMembership('vice_captain'))
		expect(crewStore.canPromoteTo('vice_captain')).toBe(false)
	})
})

describe('canDemote', () => {
	it('captain can demote vice_captain', () => {
		crewStore.setCrew(makeCrew(), makeMembership('captain'))
		expect(crewStore.canDemote('vice_captain')).toBe(true)
	})

	it('captain cannot demote captain', () => {
		crewStore.setCrew(makeCrew(), makeMembership('captain'))
		expect(crewStore.canDemote('captain')).toBe(false)
	})

	it('vice_captain cannot demote', () => {
		crewStore.setCrew(makeCrew(), makeMembership('vice_captain'))
		expect(crewStore.canDemote('vice_captain')).toBe(false)
	})
})

// ============================================================================
// Actions
// ============================================================================

describe('actions', () => {
	it('setCrew sets crew and membership, clears error', () => {
		crewStore.setError('old error')
		crewStore.setCrew(makeCrew(), makeMembership('captain'))
		expect(crewStore.crew).not.toBeNull()
		expect(crewStore.membership).not.toBeNull()
		expect(crewStore.error).toBeNull()
	})

	it('setMembership updates membership independently', () => {
		crewStore.setCrew(makeCrew(), makeMembership('member'))
		crewStore.setMembership(makeMembership('captain'))
		expect(crewStore.isCaptain).toBe(true)
	})

	it('clear resets all state', () => {
		crewStore.setCrew(makeCrew(), makeMembership('captain'))
		crewStore.setPendingInvitations([makeInvitation('inv-1')])
		crewStore.setLoading(true)
		crewStore.setError('some error')

		crewStore.clear()

		expect(crewStore.crew).toBeNull()
		expect(crewStore.membership).toBeNull()
		expect(crewStore.pendingInvitations).toHaveLength(0)
		expect(crewStore.isLoading).toBe(false)
		expect(crewStore.error).toBeNull()
	})
})

// ============================================================================
// Invitation management
// ============================================================================

describe('invitations', () => {
	it('setPendingInvitations replaces the list', () => {
		crewStore.setPendingInvitations([makeInvitation('inv-1'), makeInvitation('inv-2')])
		expect(crewStore.pendingInvitationCount).toBe(2)
		expect(crewStore.hasPendingInvitations).toBe(true)
	})

	it('addPendingInvitation appends', () => {
		crewStore.setPendingInvitations([makeInvitation('inv-1')])
		crewStore.addPendingInvitation(makeInvitation('inv-2'))
		expect(crewStore.pendingInvitationCount).toBe(2)
	})

	it('removePendingInvitation filters by id', () => {
		crewStore.setPendingInvitations([makeInvitation('inv-1'), makeInvitation('inv-2')])
		crewStore.removePendingInvitation('inv-1')
		expect(crewStore.pendingInvitationCount).toBe(1)
		expect(crewStore.pendingInvitations[0]?.id).toBe('inv-2')
	})

	it('hasPendingInvitations is false when empty', () => {
		expect(crewStore.hasPendingInvitations).toBe(false)
		expect(crewStore.pendingInvitationCount).toBe(0)
	})
})
