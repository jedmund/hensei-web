import type { Party } from '$lib/types/api/party'
import * as partiesApi from '$lib/api/resources/parties'
import type { FetchLike } from '$lib/api/core'

export interface EditabilityResult {
  canEdit: boolean
  headers?: Record<string, string>
  reason?: string
}

export interface PartyUpdatePayload {
  name?: string | null
  description?: string | null
  element?: number
  raidId?: string
  chargeAttack?: boolean
  fullAuto?: boolean
  autoGuard?: boolean
  autoSummon?: boolean
  clearTime?: number | null
  buttonCount?: number | null
  chainCount?: number | null
  turnCount?: number | null
  jobId?: string
  visibility?: number
  localId?: string
}

/**
 * Party service - handles business logic for party operations
 */
export class PartyService {
  constructor(private fetch: FetchLike) {}
  
  /**
   * Get party by shortcode
   */
  async getByShortcode(shortcode: string): Promise<Party> {
    return partiesApi.getByShortcode(this.fetch, shortcode)
  }
  
  /**
   * Create a new party
   */
  async create(payload: PartyUpdatePayload, editKey?: string): Promise<{
    party: Party
    editKey?: string
  }> {
    const headers = this.buildHeaders(editKey)
    const apiPayload = this.mapToApiPayload(payload)
    const result = await partiesApi.create(this.fetch, apiPayload, headers)

    // Store edit key if returned
    if (result.editKey && typeof window !== 'undefined') {
      localStorage.setItem(`edit_key_${result.party.shortcode}`, result.editKey)
    }

    return result
  }
  
  /**
   * Update party details
   */
  async update(id: string, payload: PartyUpdatePayload, editKey?: string): Promise<Party> {
    const headers = this.buildHeaders(editKey)
    const apiPayload = this.mapToApiPayload(payload)
    return partiesApi.update(this.fetch, id, apiPayload, headers)
  }
  
  /**
   * Update party guidebooks
   */
  async updateGuidebooks(
    id: string,
    position: number,
    guidebookId: string | null,
    editKey?: string
  ): Promise<Party> {
    const headers = this.buildHeaders(editKey)
    const payload: any = {}
    
    // Map position to guidebook1_id, guidebook2_id, guidebook3_id
    if (position >= 0 && position <= 2) {
      payload[`guidebook${position + 1}Id`] = guidebookId
    }
    
    return partiesApi.update(this.fetch, id, payload, headers)
  }
  
  /**
   * Remix a party (create a copy)
   */
  async remix(shortcode: string, localId?: string, editKey?: string): Promise<{
    party: Party
    editKey?: string
  }> {
    const headers = this.buildHeaders(editKey)
    const result = await partiesApi.remix(this.fetch, shortcode, localId, headers)
    
    // Store edit key if returned
    if (result.editKey && typeof window !== 'undefined') {
      localStorage.setItem(`edit_key_${result.party.shortcode}`, result.editKey)
    }
    
    return result
  }
  
  /**
   * Favorite a party
   */
  async favorite(id: string): Promise<void> {
    return partiesApi.favorite(this.fetch, id)
  }
  
  /**
   * Unfavorite a party
   */
  async unfavorite(id: string): Promise<void> {
    return partiesApi.unfavorite(this.fetch, id)
  }
  
  /**
   * Delete a party
   */
  async delete(id: string, editKey?: string): Promise<void> {
    const headers = this.buildHeaders(editKey)
    return partiesApi.deleteParty(this.fetch, id, headers)
  }
  
  /**
   * Compute editability for a party
   */
  computeEditability(
    party: Party,
    authUserId?: string,
    localId?: string,
    editKey?: string
  ): EditabilityResult {
    // Owner can always edit
    if (authUserId && party.user?.id === authUserId) {
      return { canEdit: true, reason: 'owner' }
    }
    
    // Local owner can edit if no server user
    const isLocalOwner = localId && party.localId === localId
    const hasNoServerUser = !party.user?.id
    
    if (isLocalOwner && hasNoServerUser) {
      const base = { canEdit: true, reason: 'local_owner' as const }
      return editKey ? { ...base, headers: { 'X-Edit-Key': editKey } } : base
    }
    
    // Check for edit key permission
    if (editKey && typeof window !== 'undefined') {
      const storedKey = localStorage.getItem(`edit_key_${party.shortcode}`)
      if (storedKey === editKey) {
        return { canEdit: true, headers: { 'X-Edit-Key': editKey }, reason: 'edit_key' }
      }
    }
    
    return { canEdit: false, reason: 'no_permission' }
  }
  
  /**
   * Get or create local ID for anonymous users
   */
  getLocalId(): string {
    if (typeof window === 'undefined') return ''
    
    let localId = localStorage.getItem('local_id')
    if (!localId) {
      localId = crypto.randomUUID()
      localStorage.setItem('local_id', localId)
    }
    return localId
  }
  
  /**
   * Get edit key for a party
   */
  getEditKey(shortcode: string): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(`edit_key_${shortcode}`)
  }
  
  /**
   * Store edit key for a party
   */
  storeEditKey(shortcode: string, editKey: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`edit_key_${shortcode}`, editKey)
    }
  }
  
  // Private helpers
  
  private buildHeaders(editKey?: string): Record<string, string> {
    const headers: Record<string, string> = {}
    if (editKey) {
      headers['X-Edit-Key'] = editKey
    }
    return headers
  }
  
  private mapToApiPayload(payload: PartyUpdatePayload): Partial<Party> {
    const mapped: any = {}

    if (payload.name !== undefined) mapped.name = payload.name
    if (payload.description !== undefined) mapped.description = payload.description
    if (payload.element !== undefined) mapped.element = payload.element
    if (payload.raidId !== undefined) mapped.raid = { id: payload.raidId }
    if (payload.chargeAttack !== undefined) mapped.chargeAttack = payload.chargeAttack
    if (payload.fullAuto !== undefined) mapped.fullAuto = payload.fullAuto
    if (payload.autoGuard !== undefined) mapped.autoGuard = payload.autoGuard
    if (payload.autoSummon !== undefined) mapped.autoSummon = payload.autoSummon
    if (payload.clearTime !== undefined) mapped.clearTime = payload.clearTime
    if (payload.buttonCount !== undefined) mapped.buttonCount = payload.buttonCount
    if (payload.chainCount !== undefined) mapped.chainCount = payload.chainCount
    if (payload.turnCount !== undefined) mapped.turnCount = payload.turnCount
    if (payload.jobId !== undefined) mapped.job = { id: payload.jobId }
    if (payload.visibility !== undefined) mapped.visibility = payload.visibility
    if (payload.localId !== undefined) mapped.localId = payload.localId

    return mapped
  }
}
