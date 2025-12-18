import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'
import type {
  GwEvent,
  CrewGwParticipation,
  GwCrewScore,
  GwIndividualScore,
  CreateGwEventInput,
  UpdateGwEventInput,
  UpdateParticipationRankingInput,
  CreateCrewScoreInput,
  UpdateCrewScoreInput,
  CreateIndividualScoreInput,
  BatchIndividualScoresInput
} from '$lib/types/api/gw'

/**
 * Adapter for Guild War (Unite and Fight) API operations
 */
export class GwAdapter extends BaseAdapter {
  // ==================== GW Event Operations ====================

  /**
   * Get all GW events
   */
  async getEvents(options?: RequestOptions): Promise<GwEvent[]> {
    const response = await this.request<{ gwEvents: GwEvent[] }>('/gw_events', options)
    return response.gwEvents
  }

  /**
   * Get a single GW event
   */
  async getEvent(eventId: string, options?: RequestOptions): Promise<GwEvent> {
    const response = await this.request<{ gwEvent: GwEvent }>(`/gw_events/${eventId}`, options)
    return response.gwEvent
  }

  /**
   * Create a GW event (admin only)
   */
  async createEvent(input: CreateGwEventInput, options?: RequestOptions): Promise<GwEvent> {
    const response = await this.request<{ gwEvent: GwEvent }>('/gw_events', {
      ...options,
      method: 'POST',
      body: JSON.stringify({ gw_event: input })
    })
    this.clearCache('/gw_events')
    return response.gwEvent
  }

  /**
   * Update a GW event (admin only)
   */
  async updateEvent(eventId: string, input: UpdateGwEventInput, options?: RequestOptions): Promise<GwEvent> {
    const response = await this.request<{ gwEvent: GwEvent }>(`/gw_events/${eventId}`, {
      ...options,
      method: 'PUT',
      body: JSON.stringify({ gw_event: input })
    })
    this.clearCache('/gw_events')
    this.clearCache(`/gw_events/${eventId}`)
    return response.gwEvent
  }

  // ==================== Participation Operations ====================

  /**
   * Join a GW event (creates participation for current crew)
   */
  async joinEvent(eventId: string, options?: RequestOptions): Promise<CrewGwParticipation> {
    const response = await this.request<{ participation: CrewGwParticipation }>(
      `/gw_events/${eventId}/participations`,
      {
        ...options,
        method: 'POST'
      }
    )
    this.clearCache('/crew/gw_participations')
    return response.participation
  }

  /**
   * Get all crew's GW participations
   */
  async getParticipations(options?: RequestOptions): Promise<CrewGwParticipation[]> {
    const response = await this.request<{ participations: CrewGwParticipation[] }>(
      '/crew/gw_participations',
      options
    )
    return response.participations
  }

  /**
   * Get a single participation with scores
   */
  async getParticipation(participationId: string, options?: RequestOptions): Promise<CrewGwParticipation> {
    const response = await this.request<{ crewGwParticipation: CrewGwParticipation }>(
      `/crew/gw_participations/${participationId}`,
      options
    )
    return response.crewGwParticipation
  }

  /**
   * Get event and participation by event ID or event number
   * Returns the event (if found), the crew's participation (if any), members active during the event, and phantom players
   */
  async getEventWithParticipation(
    eventIdOrNumber: string | number,
    options?: RequestOptions
  ): Promise<{
    gwEvent: GwEvent | null
    participation: CrewGwParticipation | null
    membersDuringEvent: Array<{ id: string; user?: { id: string; username: string }; retired: boolean }>
    phantomPlayers: Array<{ id: string; name: string; retired: boolean }>
  }> {
    const response = await this.request<{
      gwEvent: GwEvent | null
      crewGwParticipation: CrewGwParticipation | null
      membersDuringEvent: Array<{ id: string; user?: { id: string; username: string }; retired: boolean }>
      phantomPlayers: Array<{ id: string; name: string; retired: boolean }>
    }>(`/crew/gw_participations/by_event/${eventIdOrNumber}`, options)
    return {
      gwEvent: response.gwEvent,
      participation: response.crewGwParticipation,
      membersDuringEvent: response.membersDuringEvent ?? [],
      phantomPlayers: response.phantomPlayers ?? []
    }
  }

  /**
   * Update participation rankings
   */
  async updateParticipationRanking(
    participationId: string,
    input: UpdateParticipationRankingInput,
    options?: RequestOptions
  ): Promise<CrewGwParticipation> {
    const response = await this.request<{ participation: CrewGwParticipation }>(
      `/crew/gw_participations/${participationId}`,
      {
        ...options,
        method: 'PUT',
        body: JSON.stringify({ participation: input })
      }
    )
    this.clearCache('/crew/gw_participations')
    this.clearCache(`/crew/gw_participations/${participationId}`)
    return response.participation
  }

  // ==================== Crew Score Operations ====================

  /**
   * Add a crew score for a round
   */
  async addCrewScore(
    participationId: string,
    input: CreateCrewScoreInput,
    options?: RequestOptions
  ): Promise<GwCrewScore> {
    const response = await this.request<{ crewScore: GwCrewScore }>(
      `/crew/gw_participations/${participationId}/crew_scores`,
      {
        ...options,
        method: 'POST',
        body: JSON.stringify({ crew_score: input })
      }
    )
    this.clearCache(`/crew/gw_participations/${participationId}`)
    return response.crewScore
  }

  /**
   * Update a crew score
   */
  async updateCrewScore(
    participationId: string,
    scoreId: string,
    input: UpdateCrewScoreInput,
    options?: RequestOptions
  ): Promise<GwCrewScore> {
    const response = await this.request<{ crewScore: GwCrewScore }>(
      `/crew/gw_participations/${participationId}/crew_scores/${scoreId}`,
      {
        ...options,
        method: 'PUT',
        body: JSON.stringify({ crew_score: input })
      }
    )
    this.clearCache(`/crew/gw_participations/${participationId}`)
    return response.crewScore
  }

  /**
   * Delete a crew score
   */
  async deleteCrewScore(
    participationId: string,
    scoreId: string,
    options?: RequestOptions
  ): Promise<void> {
    await this.request<void>(
      `/crew/gw_participations/${participationId}/crew_scores/${scoreId}`,
      {
        ...options,
        method: 'DELETE'
      }
    )
    this.clearCache(`/crew/gw_participations/${participationId}`)
  }

  // ==================== Individual Score Operations ====================

  /**
   * Add an individual score
   */
  async addIndividualScore(
    participationId: string,
    input: CreateIndividualScoreInput,
    options?: RequestOptions
  ): Promise<GwIndividualScore> {
    const response = await this.request<{ individualScore: GwIndividualScore }>(
      `/crew/gw_participations/${participationId}/individual_scores`,
      {
        ...options,
        method: 'POST',
        body: JSON.stringify({ individual_score: input })
      }
    )
    this.clearCache(`/crew/gw_participations/${participationId}`)
    return response.individualScore
  }

  /**
   * Batch add individual scores
   */
  async batchAddIndividualScores(
    participationId: string,
    input: BatchIndividualScoresInput,
    options?: RequestOptions
  ): Promise<GwIndividualScore[]> {
    const response = await this.request<{ individualScores: GwIndividualScore[] }>(
      `/crew/gw_participations/${participationId}/individual_scores/batch`,
      {
        ...options,
        method: 'POST',
        body: JSON.stringify(input)
      }
    )
    this.clearCache(`/crew/gw_participations/${participationId}`)
    return response.individualScores
  }

  /**
   * Update an individual score
   */
  async updateIndividualScore(
    participationId: string,
    scoreId: string,
    input: Partial<CreateIndividualScoreInput>,
    options?: RequestOptions
  ): Promise<GwIndividualScore> {
    const response = await this.request<{ individualScore: GwIndividualScore }>(
      `/crew/gw_participations/${participationId}/individual_scores/${scoreId}`,
      {
        ...options,
        method: 'PUT',
        body: JSON.stringify({ individual_score: input })
      }
    )
    this.clearCache(`/crew/gw_participations/${participationId}`)
    return response.individualScore
  }

  /**
   * Delete an individual score
   */
  async deleteIndividualScore(
    participationId: string,
    scoreId: string,
    options?: RequestOptions
  ): Promise<void> {
    await this.request<void>(
      `/crew/gw_participations/${participationId}/individual_scores/${scoreId}`,
      {
        ...options,
        method: 'DELETE'
      }
    )
    this.clearCache(`/crew/gw_participations/${participationId}`)
  }

  // ==================== Individual Score Operations (by Event) ====================
  // These endpoints auto-create participation if needed (officers only)

  /**
   * Add an individual score by event ID (auto-creates participation)
   */
  async addIndividualScoreByEvent(
    eventId: string,
    input: CreateIndividualScoreInput,
    options?: RequestOptions
  ): Promise<GwIndividualScore> {
    const response = await this.request<{ individualScore: GwIndividualScore }>(
      `/crew/gw_events/${eventId}/individual_scores`,
      {
        ...options,
        method: 'POST',
        body: JSON.stringify({ individual_score: input })
      }
    )
    this.clearCache('/crew/gw_participations')
    return response.individualScore
  }

  /**
   * Batch add individual scores by event ID (auto-creates participation)
   */
  async batchAddIndividualScoresByEvent(
    eventId: string,
    input: BatchIndividualScoresInput,
    options?: RequestOptions
  ): Promise<GwIndividualScore[]> {
    const response = await this.request<{ individualScores: GwIndividualScore[] }>(
      `/crew/gw_events/${eventId}/individual_scores/batch`,
      {
        ...options,
        method: 'POST',
        body: JSON.stringify(input)
      }
    )
    this.clearCache('/crew/gw_participations')
    return response.individualScores
  }
}

export const gwAdapter = new GwAdapter(DEFAULT_ADAPTER_CONFIG)
