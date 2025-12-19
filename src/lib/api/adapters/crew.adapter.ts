import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'
import type {
  Crew,
  CrewMembership,
  CrewMembersResponse,
  CrewInvitation,
  PhantomPlayer,
  CreateCrewInput,
  UpdateCrewInput,
  CreatePhantomPlayerInput,
  UpdatePhantomPlayerInput,
  UpdateMembershipInput,
  MemberFilter
} from '$lib/types/api/crew'

/**
 * Adapter for crew-related API operations
 */
export class CrewAdapter extends BaseAdapter {
  // ==================== Crew Operations ====================

  /**
   * Get current user's crew
   */
  async getMyCrew(options?: RequestOptions): Promise<Crew> {
    const response = await this.request<{ crew: Crew }>('/crew', options)
    return response.crew
  }

  /**
   * Create a new crew (user becomes captain)
   */
  async create(input: CreateCrewInput, options?: RequestOptions): Promise<Crew> {
    const response = await this.request<{ crew: Crew }>('/crews', {
      ...options,
      method: 'POST',
      body: JSON.stringify({ crew: input })
    })
    return response.crew
  }

  /**
   * Update current user's crew (officers only)
   */
  async update(input: UpdateCrewInput, options?: RequestOptions): Promise<Crew> {
    const response = await this.request<{ crew: Crew }>('/crew', {
      ...options,
      method: 'PUT',
      body: JSON.stringify({ crew: input })
    })
    this.clearCache('/crew')
    return response.crew
  }

  /**
   * Get crew members with optional filter
   * @param filter - 'active' (default), 'retired', 'phantom', 'all'
   */
  async getMembers(filter: MemberFilter = 'active', options?: RequestOptions): Promise<CrewMembersResponse> {
    const params = filter !== 'active' ? { filter } : undefined
    return this.request<CrewMembersResponse>('/crew/members', { ...options, params })
  }

  /**
   * Leave current crew (not available for captain)
   */
  async leave(options?: RequestOptions): Promise<void> {
    await this.request<void>('/crew/leave', {
      ...options,
      method: 'POST'
    })
    this.clearCache('/crew')
    this.clearCache('/crew/members')
  }

  /**
   * Transfer captain role to another member (captain only)
   */
  async transferCaptain(crewId: string, userId: string, options?: RequestOptions): Promise<Crew> {
    const response = await this.request<{ crew: Crew }>(`/crews/${crewId}/transfer_captain`, {
      ...options,
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
    this.clearCache('/crew')
    this.clearCache('/crew/members')
    return response.crew
  }

  // ==================== Membership Operations ====================

  /**
   * Update a member's role or joined_at (officers for joined_at, captain for role)
   */
  async updateMembership(
    crewId: string,
    membershipId: string,
    input: UpdateMembershipInput,
    options?: RequestOptions
  ): Promise<CrewMembership> {
    const response = await this.request<{ membership: CrewMembership }>(
      `/crews/${crewId}/memberships/${membershipId}`,
      {
        ...options,
        method: 'PUT',
        body: JSON.stringify({ membership: input })
      }
    )
    this.clearCache('/crew/members')
    return response.membership
  }

  /**
   * Remove a member from crew (officers only)
   */
  async removeMember(crewId: string, membershipId: string, options?: RequestOptions): Promise<void> {
    await this.request<void>(`/crews/${crewId}/memberships/${membershipId}`, {
      ...options,
      method: 'DELETE'
    })
    this.clearCache('/crew/members')
  }

  /**
   * Get all membership periods for a user in a crew (for boomerang players)
   */
  async getMembershipHistory(crewId: string, userId: string, options?: RequestOptions): Promise<CrewMembership[]> {
    const response = await this.request<{ memberships: CrewMembership[] }>(
      `/crews/${crewId}/memberships/by_user/${userId}`,
      options
    )
    return response.memberships
  }

  // ==================== Invitation Operations ====================

  /**
   * Send invitation to a user (officers only)
   */
  async sendInvitation(crewId: string, userId: string, options?: RequestOptions): Promise<CrewInvitation> {
    const response = await this.request<{ invitation: CrewInvitation }>(`/crews/${crewId}/invitations`, {
      ...options,
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
    return response.invitation
  }

  /**
   * Get crew's sent invitations
   */
  async getCrewInvitations(crewId: string, options?: RequestOptions): Promise<CrewInvitation[]> {
    const response = await this.request<{ invitations: CrewInvitation[] }>(
      `/crews/${crewId}/invitations`,
      options
    )
    return response.invitations
  }

  /**
   * Get current user's pending invitations
   */
  async getPendingInvitations(options?: RequestOptions): Promise<CrewInvitation[]> {
    const response = await this.request<{ invitations: CrewInvitation[] }>('/invitations/pending', options)
    return response.invitations
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(invitationId: string, options?: RequestOptions): Promise<CrewMembership> {
    const response = await this.request<{ membership: CrewMembership }>(
      `/invitations/${invitationId}/accept`,
      {
        ...options,
        method: 'POST'
      }
    )
    this.clearCache('/crew')
    this.clearCache('/invitations/pending')
    return response.membership
  }

  /**
   * Reject an invitation
   */
  async rejectInvitation(invitationId: string, options?: RequestOptions): Promise<void> {
    await this.request<void>(`/invitations/${invitationId}/reject`, {
      ...options,
      method: 'POST'
    })
    this.clearCache('/invitations/pending')
  }

  // ==================== Phantom Player Operations ====================

  /**
   * Create a phantom player (officers only)
   */
  async createPhantom(
    crewId: string,
    input: CreatePhantomPlayerInput,
    options?: RequestOptions
  ): Promise<PhantomPlayer> {
    const response = await this.request<{ phantom_player: PhantomPlayer }>(
      `/crews/${crewId}/phantom_players`,
      {
        ...options,
        method: 'POST',
        body: JSON.stringify({ phantom_player: input })
      }
    )
    this.clearCache('/crew/members')
    return response.phantom_player
  }

  /**
   * Create multiple phantom players at once (officers only)
   */
  async bulkCreatePhantoms(
    crewId: string,
    phantoms: CreatePhantomPlayerInput[],
    options?: RequestOptions
  ): Promise<PhantomPlayer[]> {
    const response = await this.request<{ phantom_players: PhantomPlayer[] }>(
      `/crews/${crewId}/phantom_players/bulk_create`,
      {
        ...options,
        method: 'POST',
        body: JSON.stringify({ phantom_players: phantoms })
      }
    )
    this.clearCache('/crew/members')
    return response.phantom_players
  }

  /**
   * Update a phantom player
   */
  async updatePhantom(
    crewId: string,
    phantomId: string,
    input: UpdatePhantomPlayerInput,
    options?: RequestOptions
  ): Promise<PhantomPlayer> {
    const response = await this.request<{ phantom_player: PhantomPlayer }>(
      `/crews/${crewId}/phantom_players/${phantomId}`,
      {
        ...options,
        method: 'PUT',
        body: JSON.stringify({ phantom_player: input })
      }
    )
    this.clearCache('/crew/members')
    return response.phantom_player
  }

  /**
   * Delete a phantom player
   */
  async deletePhantom(crewId: string, phantomId: string, options?: RequestOptions): Promise<void> {
    await this.request<void>(`/crews/${crewId}/phantom_players/${phantomId}`, {
      ...options,
      method: 'DELETE'
    })
    this.clearCache('/crew/members')
  }

  /**
   * Assign a phantom player to a user (officers only)
   */
  async assignPhantom(
    crewId: string,
    phantomId: string,
    userId: string,
    options?: RequestOptions
  ): Promise<PhantomPlayer> {
    const response = await this.request<{ phantom_player: PhantomPlayer }>(
      `/crews/${crewId}/phantom_players/${phantomId}/assign`,
      {
        ...options,
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
      }
    )
    this.clearCache('/crew/members')
    return response.phantom_player
  }

  /**
   * Confirm claim of a phantom player (by the assigned user)
   */
  async confirmPhantomClaim(crewId: string, phantomId: string, options?: RequestOptions): Promise<PhantomPlayer> {
    const response = await this.request<{ phantom_player: PhantomPlayer }>(
      `/crews/${crewId}/phantom_players/${phantomId}/confirm_claim`,
      {
        ...options,
        method: 'POST'
      }
    )
    this.clearCache('/crew/members')
    return response.phantom_player
  }

  /**
   * Decline claim of a phantom player (by the assigned user)
   */
  async declinePhantomClaim(crewId: string, phantomId: string, options?: RequestOptions): Promise<PhantomPlayer> {
    const response = await this.request<{ phantom_player: PhantomPlayer }>(
      `/crews/${crewId}/phantom_players/${phantomId}/decline_claim`,
      {
        ...options,
        method: 'POST'
      }
    )
    this.clearCache('/crew/members')
    this.clearCache('/pending_phantom_claims')
    return response.phantom_player
  }

  /**
   * Get pending phantom claims for current user (phantoms assigned but not yet confirmed)
   */
  async getPendingPhantomClaims(options?: RequestOptions): Promise<PhantomPlayer[]> {
    const response = await this.request<{ phantomClaims: PhantomPlayer[] }>(
      '/pending_phantom_claims',
      options
    )
    return response.phantomClaims
  }
}

export const crewAdapter = new CrewAdapter(DEFAULT_ADAPTER_CONFIG)
