// Crew and membership types based on Rails blueprints
// These define the crew management structure

import type { User } from './entities'

// Crew roles
export type CrewRole = 'member' | 'vice_captain' | 'captain'

// Invitation status
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

// Member filter options for GET /crew/members
export type MemberFilter = 'active' | 'retired' | 'phantom' | 'all'

// Crew from CrewBlueprint
export interface Crew {
  id: string
  name: string
  gamertag: string | null
  granblueCrewId: string | null
  description: string | null
  createdAt: string
  // From :full view
  memberCount?: number
  captain?: User
  viceCaptains?: User[]
  // From :with_membership view (current user's membership)
  currentMembership?: CrewMembership
}

// Minimal crew for references
export interface CrewMinimal {
  id: string
  name: string
  gamertag: string | null
}

// CrewMembership from CrewMembershipBlueprint
export interface CrewMembership {
  id: string
  role: CrewRole
  retired: boolean
  retiredAt: string | null
  joinedAt: string | null
  createdAt: string
  // From :with_user view
  user?: User
  // From :with_crew view
  crew?: CrewMinimal
}

// PhantomPlayer from PhantomPlayerBlueprint
export interface PhantomPlayer {
  id: string
  name: string
  granblueId: string | null
  notes: string | null
  claimed: boolean
  claimConfirmed: boolean
  retired: boolean
  retiredAt: string | null
  joinedAt: string | null
  // From :with_claimed_by view
  claimedBy?: User
  // From :with_scores view
  totalScore?: number
  scoreCount?: number
}

// CrewInvitation from CrewInvitationBlueprint
export interface CrewInvitation {
  id: string
  status: InvitationStatus
  expiresAt: string
  createdAt: string
  // From :with_crew view
  crew?: CrewMinimal
  // From :with_user view
  user?: User
  invitedBy?: User
}

// Response type for GET /crew/members
export interface CrewMembersResponse {
  members: CrewMembership[]
  phantoms: PhantomPlayer[]
}

// Input types for mutations

export interface CreateCrewInput {
  name: string
  gamertag?: string
  granblueCrewId?: string
  description?: string
}

export interface UpdateCrewInput {
  name?: string
  gamertag?: string
  granblueCrewId?: string
  description?: string
}

export interface CreatePhantomPlayerInput {
  name: string
  granblueId?: string
  notes?: string
  joinedAt?: string
}

export interface UpdatePhantomPlayerInput {
  name?: string
  granblueId?: string
  notes?: string
  joinedAt?: string
}

export interface UpdateMembershipInput {
  role?: CrewRole
  joinedAt?: string
}
