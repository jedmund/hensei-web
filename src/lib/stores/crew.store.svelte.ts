/**
 * Crew Store
 *
 * Manages the current user's crew state using Svelte 5 runes.
 * This store is populated after auth and provides convenient
 * accessors for crew-related permissions.
 */

import type { Crew, CrewMembership, CrewInvitation } from '$lib/types/api/crew'

class CrewStore {
  // Core state
  crew = $state<Crew | null>(null)
  membership = $state<CrewMembership | null>(null)
  pendingInvitations = $state<CrewInvitation[]>([])
  isLoading = $state(false)
  error = $state<string | null>(null)

  // Computed properties
  get isInCrew(): boolean {
    return this.crew !== null
  }

  get isCaptain(): boolean {
    return this.membership?.role === 'captain'
  }

  get isViceCaptain(): boolean {
    return this.membership?.role === 'vice_captain'
  }

  get isOfficer(): boolean {
    return this.isCaptain || this.isViceCaptain
  }

  get isMember(): boolean {
    return this.membership?.role === 'member'
  }

  get canManageMembers(): boolean {
    return this.isOfficer
  }

  get canEditCrew(): boolean {
    return this.isOfficer
  }

  get canTransferCaptain(): boolean {
    return this.isCaptain
  }

  get canLeaveCrew(): boolean {
    return this.isInCrew && !this.isCaptain
  }

  get canManagePhantoms(): boolean {
    return this.isOfficer
  }

  get canRecordOthersScores(): boolean {
    return this.isOfficer
  }

  get hasPendingInvitations(): boolean {
    return this.pendingInvitations.length > 0
  }

  get pendingInvitationCount(): number {
    return this.pendingInvitations.length
  }

  // Actions
  setCrew(crew: Crew | null, membership: CrewMembership | null = null) {
    this.crew = crew
    this.membership = membership
    this.error = null
  }

  setMembership(membership: CrewMembership | null) {
    this.membership = membership
  }

  setPendingInvitations(invitations: CrewInvitation[]) {
    this.pendingInvitations = invitations
  }

  addPendingInvitation(invitation: CrewInvitation) {
    this.pendingInvitations = [...this.pendingInvitations, invitation]
  }

  removePendingInvitation(invitationId: string) {
    this.pendingInvitations = this.pendingInvitations.filter((inv) => inv.id !== invitationId)
  }

  setLoading(loading: boolean) {
    this.isLoading = loading
  }

  setError(error: string | null) {
    this.error = error
  }

  clear() {
    this.crew = null
    this.membership = null
    this.pendingInvitations = []
    this.isLoading = false
    this.error = null
  }

  /**
   * Check if current user can perform an action on a specific member
   */
  canActOnMember(memberRole: 'member' | 'vice_captain' | 'captain'): boolean {
    if (!this.isOfficer) return false

    // Captain can act on anyone except themselves
    if (this.isCaptain) return true

    // Vice captain can only act on regular members
    if (this.isViceCaptain && memberRole === 'member') return true

    return false
  }

  /**
   * Check if current user can promote a member to a specific role
   */
  canPromoteTo(targetRole: 'vice_captain' | 'captain'): boolean {
    // Only captain can promote to vice_captain
    if (targetRole === 'vice_captain') return this.isCaptain

    // No one can promote to captain (must transfer)
    return false
  }

  /**
   * Check if current user can demote a member
   */
  canDemote(memberRole: 'vice_captain' | 'captain'): boolean {
    // Only captain can demote vice captains
    if (memberRole === 'vice_captain') return this.isCaptain

    return false
  }
}

export const crewStore = new CrewStore()
