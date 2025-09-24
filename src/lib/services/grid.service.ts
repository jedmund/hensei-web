import type { Party, GridWeapon, GridSummon, GridCharacter } from '$lib/types/api/party'
import { gridAdapter, partyAdapter } from '$lib/api/adapters'
import { getDefaultMaxUncapLevel } from '$lib/utils/uncap'

export interface GridOperation {
  type: 'add' | 'replace' | 'remove' | 'move' | 'swap'
  itemId?: string
  position?: number
  targetPosition?: number
  uncapLevel?: number
  transcendenceLevel?: number
  data?: any
}

export interface GridUpdateResult {
  party: Party
  conflicts?: {
    conflicts: string[]
    incoming: string
    position: number
  }
}

/**
 * Grid service - handles grid operations for weapons, summons, and characters
 */
export class GridService {
  constructor() {}

  // Weapon Grid Operations

  async addWeapon(
    partyId: string,
    weaponId: string,
    position: number,
    editKey?: string,
    options?: { mainhand?: boolean; shortcode?: string }
  ): Promise<GridUpdateResult> {
    try {
      const gridWeapon = await gridAdapter.createWeapon({
        partyId,
        weaponId,
        position,
        mainhand: options?.mainhand,
        uncapLevel: getDefaultMaxUncapLevel('weapon'),
        transcendenceStage: 0
      }, this.buildHeaders(editKey))

      console.log('[GridService] Created grid weapon:', gridWeapon)

      // Clear party cache if shortcode provided
      if (options?.shortcode) {
        partyAdapter.clearPartyCache(options.shortcode)
      }

      // Return success without fetching party - the caller should refresh if needed
      // partyId is a UUID, not a shortcode, so we can't fetch here
      return { party: null as any }
    } catch (error: any) {
      console.error('[GridService] Error creating weapon:', error)
      if (error.type === 'conflict') {
        return {
          party: null as any, // Will be handled by conflict resolution
          conflicts: error
        }
      }
      throw error
    }
  }

  async replaceWeapon(
    partyId: string,
    gridWeaponId: string,
    newWeaponId: string,
    editKey?: string,
    options?: { shortcode?: string }
  ): Promise<GridUpdateResult> {
    try {
      // First remove the old weapon
      await gridAdapter.deleteWeapon({ id: gridWeaponId, partyId }, this.buildHeaders(editKey))

      // Then add the new one (pass shortcode along)
      const result = await this.addWeapon(partyId, newWeaponId, 0, editKey, options)
      return result
    } catch (error: any) {
      if (error.type === 'conflict') {
        return {
          party: null as any,
          conflicts: error
        }
      }
      throw error
    }
  }

  async removeWeapon(
    partyId: string,
    gridWeaponId: string,
    editKey?: string,
    options?: { shortcode?: string }
  ): Promise<Party | null> {
    await gridAdapter.deleteWeapon({ id: gridWeaponId, partyId }, this.buildHeaders(editKey))

    // Clear party cache if shortcode provided
    if (options?.shortcode) {
      partyAdapter.clearPartyCache(options.shortcode)
    }

    // Don't fetch - let caller handle refresh
    return null
  }

  async updateWeapon(
    partyId: string,
    gridWeaponId: string,
    updates: {
      position?: number
      uncapLevel?: number
      transcendenceStep?: number
      element?: number
    },
    editKey?: string,
    options?: { shortcode?: string }
  ): Promise<Party | null> {
    await gridAdapter.updateWeapon(gridWeaponId, {
      position: updates.position,
      uncapLevel: updates.uncapLevel,
      transcendenceStage: updates.transcendenceStep,
      element: updates.element
    }, this.buildHeaders(editKey))

    // Clear party cache if shortcode provided
    if (options?.shortcode) {
      partyAdapter.clearPartyCache(options.shortcode)
    }

    // Don't fetch - let caller handle refresh
    return null
  }

  async moveWeapon(
    partyId: string,
    gridWeaponId: string,
    newPosition: number,
    editKey?: string,
    options?: { shortcode?: string }
  ): Promise<Party | null> {
    await gridAdapter.updateWeaponPosition({
      partyId,
      id: gridWeaponId,
      position: newPosition
    }, this.buildHeaders(editKey))

    // Clear party cache if shortcode provided
    if (options?.shortcode) {
      partyAdapter.clearPartyCache(options.shortcode)
    }

    // Don't fetch - let caller handle refresh
    return null
  }

  async swapWeapons(
    partyId: string,
    gridWeaponId1: string,
    gridWeaponId2: string,
    editKey?: string,
    options?: { shortcode?: string }
  ): Promise<Party | null> {
    await gridAdapter.swapWeapons({
      partyId,
      sourceId: gridWeaponId1,
      targetId: gridWeaponId2
    }, this.buildHeaders(editKey))

    // Clear party cache if shortcode provided
    if (options?.shortcode) {
      partyAdapter.clearPartyCache(options.shortcode)
    }

    // Don't fetch - let caller handle refresh
    return null
  }

  async updateWeaponUncap(
    partyId: string,
    gridWeaponId: string,
    uncapLevel?: number,
    transcendenceStep?: number,
    editKey?: string
  ): Promise<any> {
    return gridAdapter.updateWeaponUncap({
      id: gridWeaponId,
      partyId,
      uncapLevel: uncapLevel ?? 3,
      transcendenceStep
    }, this.buildHeaders(editKey))
  }

  // Summon Grid Operations

  async addSummon(
    partyId: string,
    summonId: string,
    position: number,
    editKey?: string,
    options?: { main?: boolean; friend?: boolean; shortcode?: string }
  ): Promise<Party> {
    const gridSummon = await gridAdapter.createSummon({
      partyId,
      summonId,
      position,
      main: options?.main,
      friend: options?.friend,
      uncapLevel: getDefaultMaxUncapLevel('summon'),
      transcendenceStage: 0
    }, this.buildHeaders(editKey))

    console.log('[GridService] Created grid summon:', gridSummon)

    // Clear party cache if shortcode provided
    if (options?.shortcode) {
      partyAdapter.clearPartyCache(options.shortcode)
    }

    // Don't fetch - partyId is UUID not shortcode
    return null as any
  }

  async replaceSummon(
    partyId: string,
    gridSummonId: string,
    newSummonId: string,
    editKey?: string,
    options?: { shortcode?: string }
  ): Promise<Party> {
    // First remove the old summon
    await gridAdapter.deleteSummon({ id: gridSummonId, partyId }, this.buildHeaders(editKey))

    // Then add the new one (pass shortcode along)
    return this.addSummon(partyId, newSummonId, 0, editKey, { ...options })
  }

  async removeSummon(
    partyId: string,
    gridSummonId: string,
    editKey?: string,
    options?: { shortcode?: string }
  ): Promise<Party | null> {
    await gridAdapter.deleteSummon({ id: gridSummonId, partyId }, this.buildHeaders(editKey))

    // Clear party cache if shortcode provided
    if (options?.shortcode) {
      partyAdapter.clearPartyCache(options.shortcode)
    }

    // Don't fetch - let caller handle refresh
    return null
  }

  async updateSummon(
    partyId: string,
    gridSummonId: string,
    updates: {
      position?: number
      quickSummon?: boolean
      uncapLevel?: number
      transcendenceStep?: number
    },
    editKey?: string,
    options?: { shortcode?: string }
  ): Promise<Party | null> {
    await gridAdapter.updateSummon(gridSummonId, {
      position: updates.position,
      quickSummon: updates.quickSummon,
      uncapLevel: updates.uncapLevel,
      transcendenceStage: updates.transcendenceStep
    }, this.buildHeaders(editKey))

    // Clear party cache if shortcode provided
    if (options?.shortcode) {
      partyAdapter.clearPartyCache(options.shortcode)
    }

    // Don't fetch - let caller handle refresh
    return null
  }

  async moveSummon(
    partyId: string,
    gridSummonId: string,
    newPosition: number,
    editKey?: string,
    options?: { shortcode?: string }
  ): Promise<Party | null> {
    await gridAdapter.updateSummonPosition({
      partyId,
      id: gridSummonId,
      position: newPosition
    }, this.buildHeaders(editKey))

    // Clear party cache if shortcode provided
    if (options?.shortcode) {
      partyAdapter.clearPartyCache(options.shortcode)
    }

    // Don't fetch - let caller handle refresh
    return null
  }

  async swapSummons(
    partyId: string,
    gridSummonId1: string,
    gridSummonId2: string,
    editKey?: string,
    options?: { shortcode?: string }
  ): Promise<Party | null> {
    await gridAdapter.swapSummons({
      partyId,
      sourceId: gridSummonId1,
      targetId: gridSummonId2
    }, this.buildHeaders(editKey))

    // Clear party cache if shortcode provided
    if (options?.shortcode) {
      partyAdapter.clearPartyCache(options.shortcode)
    }

    // Don't fetch - let caller handle refresh
    return null
  }

  async updateSummonUncap(
    partyId: string,
    gridSummonId: string,
    uncapLevel?: number,
    transcendenceStep?: number,
    editKey?: string
  ): Promise<any> {
    return gridAdapter.updateSummonUncap({
      id: gridSummonId,
      partyId,
      uncapLevel: uncapLevel ?? 3,
      transcendenceStep
    }, this.buildHeaders(editKey))
  }

  // Character Grid Operations

  async addCharacter(
    partyId: string,
    characterId: string,
    position: number,
    editKey?: string,
    options?: { shortcode?: string }
  ): Promise<GridUpdateResult> {
    try {
      const gridCharacter = await gridAdapter.createCharacter({
        partyId,
        characterId,
        position,
        uncapLevel: getDefaultMaxUncapLevel('character'),
        transcendenceStage: 0
      }, this.buildHeaders(editKey))

      console.log('[GridService] Created grid character:', gridCharacter)

      // Clear party cache if shortcode provided
      if (options?.shortcode) {
        partyAdapter.clearPartyCache(options.shortcode)
      }

      // Don't fetch - partyId is UUID not shortcode
      return { party: null as any }
    } catch (error: any) {
      if (error.type === 'conflict') {
        return {
          party: null as any,
          conflicts: error
        }
      }
      throw error
    }
  }

  async replaceCharacter(
    partyId: string,
    gridCharacterId: string,
    newCharacterId: string,
    editKey?: string,
    options?: { shortcode?: string }
  ): Promise<GridUpdateResult> {
    try {
      // First remove the old character
      await gridAdapter.deleteCharacter({ id: gridCharacterId, partyId }, this.buildHeaders(editKey))

      // Then add the new one (pass shortcode along)
      return this.addCharacter(partyId, newCharacterId, 0, editKey, options)
    } catch (error: any) {
      if (error.type === 'conflict') {
        return {
          party: null as any,
          conflicts: error
        }
      }
      throw error
    }
  }

  async removeCharacter(
    partyId: string,
    gridCharacterId: string,
    editKey?: string,
    options?: { shortcode?: string }
  ): Promise<Party | null> {
    await gridAdapter.deleteCharacter({ id: gridCharacterId, partyId }, this.buildHeaders(editKey))

    // Clear party cache if shortcode provided
    if (options?.shortcode) {
      partyAdapter.clearPartyCache(options.shortcode)
    }

    // Don't fetch - let caller handle refresh
    return null
  }

  async updateCharacter(
    partyId: string,
    gridCharacterId: string,
    updates: {
      position?: number
      uncapLevel?: number
      transcendenceStep?: number
      perpetuity?: boolean
    },
    editKey?: string,
    options?: { shortcode?: string }
  ): Promise<Party | null> {
    await gridAdapter.updateCharacter(gridCharacterId, {
      position: updates.position,
      uncapLevel: updates.uncapLevel,
      transcendenceStage: updates.transcendenceStep,
      perpetualModifiers: updates.perpetuity ? {} : undefined
    }, this.buildHeaders(editKey))

    // Clear party cache if shortcode provided
    if (options?.shortcode) {
      partyAdapter.clearPartyCache(options.shortcode)
    }

    // Don't fetch - let caller handle refresh
    return null
  }

  async moveCharacter(
    partyId: string,
    gridCharacterId: string,
    newPosition: number,
    editKey?: string,
    options?: { shortcode?: string }
  ): Promise<Party | null> {
    await gridAdapter.updateCharacterPosition({
      partyId,
      id: gridCharacterId,
      position: newPosition
    }, this.buildHeaders(editKey))

    // Clear party cache if shortcode provided
    if (options?.shortcode) {
      partyAdapter.clearPartyCache(options.shortcode)
    }

    // Don't fetch - let caller handle refresh
    return null
  }

  async swapCharacters(
    partyId: string,
    gridCharacterId1: string,
    gridCharacterId2: string,
    editKey?: string,
    options?: { shortcode?: string }
  ): Promise<Party | null> {
    await gridAdapter.swapCharacters({
      partyId,
      sourceId: gridCharacterId1,
      targetId: gridCharacterId2
    }, this.buildHeaders(editKey))

    // Clear party cache if shortcode provided
    if (options?.shortcode) {
      partyAdapter.clearPartyCache(options.shortcode)
    }

    // Don't fetch - let caller handle refresh
    return null
  }

  async updateCharacterUncap(
    partyId: string,
    gridCharacterId: string,
    uncapLevel?: number,
    transcendenceStep?: number,
    editKey?: string
  ): Promise<any> {
    return gridAdapter.updateCharacterUncap({
      id: gridCharacterId,
      partyId,
      uncapLevel: uncapLevel ?? 3,
      transcendenceStep
    }, this.buildHeaders(editKey))
  }

  // Drag and Drop Helpers

  /**
   * Normalize drag and drop intent to a grid operation
   */
  normalizeDragIntent(
    dragType: 'weapon' | 'summon' | 'character',
    draggedItem: any,
    targetPosition: number,
    targetItem?: any
  ): GridOperation {
    // If dropping on an empty slot
    if (!targetItem) {
      return {
        type: 'add',
        itemId: draggedItem.id,
        position: targetPosition
      }
    }

    // If dragging from grid to grid
    if (draggedItem.gridId && targetItem.gridId) {
      return {
        type: 'swap',
        itemId: draggedItem.gridId,
        targetPosition: targetItem.gridId
      }
    }

    // If dragging from outside to occupied slot
    return {
      type: 'replace',
      itemId: targetItem.gridId,
      targetPosition: draggedItem.id
    }
  }

  /**
   * Apply optimistic update to local state
   */
  applyOptimisticUpdate<T extends GridWeapon | GridSummon | GridCharacter>(
    items: T[],
    operation: GridOperation
  ): T[] {
    const updated = [...items]

    switch (operation.type) {
      case 'add':
        // Add new item at position
        break

      case 'remove':
        return updated.filter(item => item.id !== operation.itemId)

      case 'move':
        const item = updated.find(i => i.id === operation.itemId)
        if (item && operation.targetPosition !== undefined) {
          item.position = operation.targetPosition
        }
        break

      case 'swap':
        const item1 = updated.find(i => i.id === operation.itemId)
        const item2 = updated.find(i => i.id === operation.targetPosition)
        if (item1 && item2) {
          const tempPos = item1.position
          item1.position = item2.position
          item2.position = tempPos
        }
        break
    }

    return updated
  }

  // Private helpers

  private buildHeaders(editKey?: string): Record<string, string> {
    const headers: Record<string, string> = {}
    if (editKey) {
      headers['X-Edit-Key'] = editKey
    }
    return headers
  }
}
