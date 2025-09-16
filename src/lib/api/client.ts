/**
 * Unified API Client for client-side use
 * All API calls go through our SvelteKit proxy endpoints
 * Automatically handles edit keys from localStorage
 * Automatically transforms data between API format and clean types
 */

import { snakeToCamel, camelToSnake } from './schemas/transforms'

export interface PartyPayload {
  name?: string
  description?: string | null
  element?: number
  visibility?: number
  localId?: string
  [key: string]: any
}

export interface GridItemOptions {
  uncapLevel?: number
  transcendenceStep?: number
  element?: number
  mainhand?: boolean
  main?: boolean
  friend?: boolean
  quickSummon?: boolean
  perpetuity?: boolean
}

/**
 * Transforms API response data to match our clean type definitions
 * - Converts snake_case to camelCase
 * - Renames "object" to proper entity names (weapon, character, summon)
 */
export function transformResponse<T>(data: any): T {
  if (data === null || data === undefined) return data

  // First convert snake_case to camelCase
  const camelCased = snakeToCamel(data)

  // Then rename "object" fields to proper entity names
  return renameObjectFields(camelCased) as T
}

/**
 * Transforms request data to match API expectations
 * - Converts camelCase to snake_case
 * - Renames entity names back to "object" for API
 */
export function transformRequest<T>(data: T): any {
  if (data === null || data === undefined) return data

  // First rename entity fields back to "object"
  const withObjectFields = renameEntityFields(data)

  // Then convert camelCase to snake_case
  return camelToSnake(withObjectFields)
}

/**
 * Renames "object" fields to proper entity names in response data
 */
function renameObjectFields(obj: any): any {
  if (obj === null || obj === undefined) return obj

  if (Array.isArray(obj)) {
    return obj.map(renameObjectFields)
  }

  if (typeof obj === 'object') {
    const result: any = {}

    for (const [key, value] of Object.entries(obj)) {
      // Handle weapons array
      if (key === 'weapons' && Array.isArray(value)) {
        result.weapons = value.map((item: any) => {
          if (item && typeof item === 'object' && 'object' in item) {
            const { object, ...rest } = item
            return { ...rest, weapon: renameObjectFields(object) }
          }
          return renameObjectFields(item)
        })
      }
      // Handle characters array
      else if (key === 'characters' && Array.isArray(value)) {
        result.characters = value.map((item: any) => {
          if (item && typeof item === 'object' && 'object' in item) {
            const { object, ...rest } = item
            return { ...rest, character: renameObjectFields(object) }
          }
          return renameObjectFields(item)
        })
      }
      // Handle summons array
      else if (key === 'summons' && Array.isArray(value)) {
        result.summons = value.map((item: any) => {
          if (item && typeof item === 'object' && 'object' in item) {
            const { object, ...rest } = item
            return { ...rest, summon: renameObjectFields(object) }
          }
          return renameObjectFields(item)
        })
      }
      // Recursively process other fields
      else {
        result[key] = renameObjectFields(value)
      }
    }

    return result
  }

  return obj
}

/**
 * Renames entity fields back to "object" for API requests
 */
function renameEntityFields(obj: any): any {
  if (obj === null || obj === undefined) return obj

  if (Array.isArray(obj)) {
    return obj.map(renameEntityFields)
  }

  if (typeof obj === 'object') {
    const result: any = {}

    for (const [key, value] of Object.entries(obj)) {
      // Handle weapons array
      if (key === 'weapons' && Array.isArray(value)) {
        result.weapons = value.map((item: any) => {
          if (item && typeof item === 'object' && 'weapon' in item) {
            const { weapon, ...rest } = item
            return { ...rest, object: renameEntityFields(weapon) }
          }
          return renameEntityFields(item)
        })
      }
      // Handle characters array
      else if (key === 'characters' && Array.isArray(value)) {
        result.characters = value.map((item: any) => {
          if (item && typeof item === 'object' && 'character' in item) {
            const { character, ...rest } = item
            return { ...rest, object: renameEntityFields(character) }
          }
          return renameEntityFields(item)
        })
      }
      // Handle summons array
      else if (key === 'summons' && Array.isArray(value)) {
        result.summons = value.map((item: any) => {
          if (item && typeof item === 'object' && 'summon' in item) {
            const { summon, ...rest } = item
            return { ...rest, object: renameEntityFields(summon) }
          }
          return renameEntityFields(item)
        })
      }
      // Recursively process other fields
      else {
        result[key] = renameEntityFields(value)
      }
    }

    return result
  }

  return obj
}

export class APIClient {
  /**
   * Get edit key for a party from localStorage
   */
  private getEditKey(partyIdOrShortcode: string): string | null {
    if (typeof window === 'undefined') return null

    // Try both formats - with party ID and shortcode
    const keyById = localStorage.getItem(`edit_key_${partyIdOrShortcode}`)
    if (keyById) return keyById

    // Also check if it's stored by shortcode
    return localStorage.getItem(`edit_key_${partyIdOrShortcode}`)
  }

  /**
   * Store edit key for a party in localStorage
   */
  storeEditKey(partyShortcode: string, editKey: string): void {
    if (typeof window !== 'undefined' && editKey) {
      localStorage.setItem(`edit_key_${partyShortcode}`, editKey)
    }
  }

  /**
   * Create a new party
   */
  async createParty(payload: PartyPayload): Promise<{ party: any; editKey?: string }> {
    const response = await fetch('/api/parties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to create party: ${response.statusText}`)
    }

    const data = await response.json()

    // Store edit key if present
    if (data.edit_key && data.party?.shortcode) {
      this.storeEditKey(data.party.shortcode, data.edit_key)
    }

    return {
      party: data.party,
      editKey: data.edit_key
    }
  }

  /**
   * Update a party
   */
  async updateParty(partyId: string, payload: Partial<PartyPayload>): Promise<any> {
    const editKey = this.getEditKey(partyId)

    const response = await fetch(`/api/parties/${partyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to update party: ${response.statusText}`)
    }

    const data = await response.json()
    // The API returns { party: { ... } }, extract the party object
    const party = data.party || data
    // Transform the response to match our clean types
    return transformResponse(party)
  }

  /**
   * Delete a party
   */
  async deleteParty(partyId: string): Promise<void> {
    const editKey = this.getEditKey(partyId)

    const response = await fetch(`/api/parties/${partyId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to delete party: ${response.statusText}`)
    }
  }

  /**
   * Add a weapon to a party
   */
  async addWeapon(
    partyId: string,
    weaponId: string,
    position: number,
    options?: GridItemOptions
  ): Promise<any> {
    const editKey = this.getEditKey(partyId)

    const response = await fetch(`/api/parties/${partyId}/weapons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify({
        weaponId,
        position,
        ...options
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to add weapon: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Update a weapon in a party
   */
  async updateWeapon(
    partyId: string,
    gridWeaponId: string,
    updates: {
      position?: number
      uncapLevel?: number
      transcendenceStep?: number
      element?: number
    }
  ): Promise<any> {
    const editKey = this.getEditKey(partyId)

    const response = await fetch(`/api/parties/${partyId}/weapons/${gridWeaponId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to update weapon: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Remove a weapon from a party
   */
  async removeWeapon(partyId: string, gridWeaponId: string): Promise<void> {
    const editKey = this.getEditKey(partyId)

    console.log('Removing weapon:', { partyId, gridWeaponId, editKey })

    const response = await fetch(`/api/parties/${partyId}/weapons`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify({ gridWeaponId })
    })

    if (!response.ok) {
      console.error('Remove weapon failed:', response.status, response.statusText)
      // Try to get the response text to see what the server is returning
      const text = await response.text()
      console.error('Response body:', text)
      let error = { error: 'Failed to remove weapon' }
      try {
        error = JSON.parse(text)
      } catch (e) {
        // Not JSON, use the text as is
      }
      throw new Error(error.error || `Failed to remove weapon: ${response.statusText}`)
    }
  }

  /**
   * Add a summon to a party
   */
  async addSummon(
    partyId: string,
    summonId: string,
    position: number,
    options?: GridItemOptions
  ): Promise<any> {
    const editKey = this.getEditKey(partyId)

    const response = await fetch(`/api/parties/${partyId}/summons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify({
        summonId,
        position,
        ...options
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to add summon: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Update a summon in a party
   */
  async updateSummon(
    partyId: string,
    gridSummonId: string,
    updates: {
      position?: number
      quickSummon?: boolean
      uncapLevel?: number
      transcendenceStep?: number
    }
  ): Promise<any> {
    const editKey = this.getEditKey(partyId)

    const response = await fetch(`/api/parties/${partyId}/summons/${gridSummonId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to update summon: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Remove a summon from a party
   */
  async removeSummon(partyId: string, gridSummonId: string): Promise<void> {
    const editKey = this.getEditKey(partyId)

    const response = await fetch(`/api/parties/${partyId}/summons`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify({ gridSummonId })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to remove summon' }))
      throw new Error(error.error || `Failed to remove summon: ${response.statusText}`)
    }
  }

  /**
   * Add a character to a party
   */
  async addCharacter(
    partyId: string,
    characterId: string,
    position: number,
    options?: GridItemOptions
  ): Promise<any> {
    const editKey = this.getEditKey(partyId)

    const response = await fetch(`/api/parties/${partyId}/characters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify({
        characterId,
        position,
        ...options
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to add character: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Update a character in a party
   */
  async updateCharacter(
    partyId: string,
    gridCharacterId: string,
    updates: {
      position?: number
      uncapLevel?: number
      transcendenceStep?: number
      perpetuity?: boolean
    }
  ): Promise<any> {
    const editKey = this.getEditKey(partyId)

    const response = await fetch(`/api/parties/${partyId}/characters/${gridCharacterId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to update character: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Remove a character from a party
   */
  async removeCharacter(partyId: string, gridCharacterId: string): Promise<void> {
    const editKey = this.getEditKey(partyId)

    const response = await fetch(`/api/parties/${partyId}/characters`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify({ gridCharacterId })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to remove character' }))
      throw new Error(error.error || `Failed to remove character: ${response.statusText}`)
    }
  }

  /**
   * Update weapon position (drag-drop)
   */
  async updateWeaponPosition(
    partyId: string,
    weaponId: string,
    position: number,
    container?: string
  ): Promise<any> {
    const editKey = this.getEditKey(partyId)

    const response = await fetch(`/api/parties/${partyId}/grid_weapons/${weaponId}/position`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify({
        position,
        ...(container ? { container } : {})
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to update weapon position: ${response.statusText}`)
    }

    const data = await response.json()
    return transformResponse(data.party || data)
  }

  /**
   * Swap two weapons (drag-drop)
   */
  async swapWeapons(partyId: string, sourceId: string, targetId: string): Promise<any> {
    const editKey = this.getEditKey(partyId)

    const response = await fetch(`/api/parties/${partyId}/grid_weapons/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify({
        source_id: sourceId,
        target_id: targetId
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to swap weapons: ${response.statusText}`)
    }

    const data = await response.json()
    return transformResponse(data.party || data)
  }

  /**
   * Update character position (drag-drop)
   */
  async updateCharacterPosition(
    partyId: string,
    characterId: string,
    position: number,
    container?: string
  ): Promise<any> {
    const editKey = this.getEditKey(partyId)

    const response = await fetch(`/api/parties/${partyId}/grid_characters/${characterId}/position`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify({
        position,
        ...(container ? { container } : {})
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to update character position: ${response.statusText}`)
    }

    const data = await response.json()
    return transformResponse(data.party || data)
  }

  /**
   * Swap two characters (drag-drop)
   */
  async swapCharacters(partyId: string, sourceId: string, targetId: string): Promise<any> {
    const editKey = this.getEditKey(partyId)

    const response = await fetch(`/api/parties/${partyId}/grid_characters/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify({
        source_id: sourceId,
        target_id: targetId
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to swap characters: ${response.statusText}`)
    }

    const data = await response.json()
    return transformResponse(data.party || data)
  }

  /**
   * Update summon position (drag-drop)
   */
  async updateSummonPosition(
    partyId: string,
    summonId: string,
    position: number,
    container?: string
  ): Promise<any> {
    const editKey = this.getEditKey(partyId)

    const response = await fetch(`/api/parties/${partyId}/grid_summons/${summonId}/position`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify({
        position,
        ...(container ? { container } : {})
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to update summon position: ${response.statusText}`)
    }

    const data = await response.json()
    return transformResponse(data.party || data)
  }

  /**
   * Swap two summons (drag-drop)
   */
  async swapSummons(partyId: string, sourceId: string, targetId: string): Promise<any> {
    const editKey = this.getEditKey(partyId)

    const response = await fetch(`/api/parties/${partyId}/grid_summons/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify({
        source_id: sourceId,
        target_id: targetId
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to swap summons: ${response.statusText}`)
    }

    const data = await response.json()
    return transformResponse(data.party || data)
  }

  /**
   * Get local ID for anonymous users
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
}

// Export a singleton instance for convenience
export const apiClient = new APIClient()