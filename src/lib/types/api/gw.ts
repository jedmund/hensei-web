// Guild War (Unite and Fight) types based on Rails blueprints
// These define the GW event and scoring structure

import type { CrewMembership, PhantomPlayer } from './crew'

// GW round numbers
// 0 = Preliminaries
// 1 = Interlude
// 2-5 = Finals Day 1-4
export type GwRound = 0 | 1 | 2 | 3 | 4 | 5

// Round labels for display
export const GW_ROUND_LABELS: Record<GwRound, string> = {
  0: 'Preliminaries',
  1: 'Interlude',
  2: 'Finals Day 1',
  3: 'Finals Day 2',
  4: 'Finals Day 3',
  5: 'Finals Day 4'
}

// GwEvent status
export type GwEventStatus = 'upcoming' | 'active' | 'completed'

// GwEvent from GwEventBlueprint
export interface GwEvent {
  id: string
  element: number // Uses GranblueEnums.ELEMENTS (0-5)
  startDate: string
  endDate: string
  eventNumber: number // GW #XX
  status?: GwEventStatus
  crewTotalScore?: number // Included when user has a crew with participation
  createdAt?: string
  updatedAt?: string
}

// CrewGwParticipation from CrewGwParticipationBlueprint
export interface CrewGwParticipation {
  id: string
  preliminaryRanking: number | null
  finalRanking: number | null
  // Aggregated stats
  totalScore?: number
  wins?: number
  losses?: number
  createdAt?: string
  // From :with_event view
  gwEvent?: GwEvent
  // From :with_scores view
  crewScores?: GwCrewScore[]
  individualScores?: GwIndividualScore[]
}

// GwCrewScore from GwCrewScoreBlueprint
export interface GwCrewScore {
  id: string
  round: GwRound
  crewScore: number
  opponentScore: number | null
  opponentName: string | null
  opponentGranblueId: string | null
  victory: boolean | null
  createdAt?: string
}

// Player type in individual scores
export type PlayerType = 'member' | 'phantom'

// GwIndividualScore from GwIndividualScoreBlueprint
export interface GwIndividualScore {
  id: string
  round: GwRound
  score: number
  isCumulative: boolean
  excused: boolean
  excuseReason?: string // Only returned to crew officers
  playerName: string
  playerType: PlayerType
  createdAt?: string
  // From :with_member view
  member?: CrewMembership
  phantom?: PhantomPlayer
}

// Input types for mutations

export interface CreateGwEventInput {
  element: number
  startDate: string
  endDate: string
  eventNumber: number
}

export interface UpdateGwEventInput {
  element?: number
  startDate?: string
  endDate?: string
  eventNumber?: number
}

export interface UpdateParticipationRankingInput {
  preliminaryRanking?: number
  finalRanking?: number
}

export interface CreateCrewScoreInput {
  round: GwRound
  crewScore: number
  opponentScore?: number
  opponentName?: string
  opponentGranblueId?: string
  victory?: boolean
}

export interface UpdateCrewScoreInput {
  crewScore?: number
  opponentScore?: number
  opponentName?: string
  opponentGranblueId?: string
  victory?: boolean
}

export interface CreateIndividualScoreInput {
  // Either crewMembershipId OR phantomPlayerId, not both
  crewMembershipId?: string
  phantomPlayerId?: string
  round: GwRound
  score: number
  isCumulative?: boolean
  excused?: boolean
  excuseReason?: string
}

// Batch score entry
export interface BatchScoreEntry {
  // For member type, use crewMembershipId; for phantom type, use phantomPlayerId
  crewMembershipId?: string
  phantomPlayerId?: string
  round: GwRound
  score: number
  isCumulative?: boolean
  excused?: boolean
  excuseReason?: string
}

export interface BatchIndividualScoresInput {
  scores: BatchScoreEntry[]
}

// Member/Phantom GW score history

export interface GwEventMinimal {
  id: string
  element: number
  eventNumber: number
  startDate: string
  endDate: string
}

export interface EventScoreSummary {
  gwEvent: GwEventMinimal
  totalScore: number | null // null = gap (player wasn't in crew during this event)
  inCrew: boolean // false = gap event, true = player was in crew
}

export interface MembershipPeriod {
  id: string
  joinedAt: string | null
  retiredAt: string | null
  retired: boolean
}

export interface MemberGwScores {
  member: CrewMembership
  eventScores: EventScoreSummary[]
  grandTotal: number
  membershipPeriods: MembershipPeriod[] // All membership periods for boomerang players
}

export interface PhantomGwScores {
  phantom: PhantomPlayer
  eventScores: EventScoreSummary[]
  grandTotal: number
}

// Aggregated data for visualization

export interface GwLeaderboardEntry {
  playerId: string
  playerName: string
  playerType: PlayerType
  totalScore: number
  roundScores: Record<GwRound, number>
}

export interface GwChartDataPoint {
  round: GwRound
  roundLabel: string
  crewScore: number
  opponentScore: number | null
  memberContributions: Array<{
    playerId: string
    playerName: string
    score: number
  }>
}
