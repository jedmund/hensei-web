import type { Party, GridWeapon, GridSummon, GridCharacter } from '$lib/types/api/party'
import { gridAdapter, partyAdapter } from '$lib/api/adapters'

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
    editKey?: string
  ): Promise<GridUpdateResult> {
    try {
      const gridWeapon = await gridAdapter.createWeapon({
        partyId,
        weaponId,
        position,
        uncapLevel: 0,
        transcendenceStage: 0
      })

      // Fetch updated party to return
      const party = await partyAdapter.getByShortcode(partyId)
      return { party }
    } catch (error: any) {
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
    editKey?: string
  ): Promise<GridUpdateResult> {
    try {
      // First remove the old weapon
      await gridAdapter.deleteWeapon({ id: gridWeaponId, partyId })

      // Then add the new one
      const result = await this.addWeapon(partyId, newWeaponId, 0, editKey)
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
    editKey?: string
  ): Promise<Party> {
    await gridAdapter.deleteWeapon({ id: gridWeaponId, partyId })

    // Return updated party
    return partyAdapter.getByShortcode(partyId)
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
    editKey?: string
  ): Promise<Party> {
    await gridAdapter.updateWeapon(gridWeaponId, {
      position: updates.position,
      uncapLevel: updates.uncapLevel,
      transcendenceStage: updates.transcendenceStep,
      element: updates.element
    })

    // Return updated party
    return partyAdapter.getByShortcode(partyId)
  }

  async moveWeapon(
    partyId: string,
    gridWeaponId: string,
    newPosition: number,
    editKey?: string
  ): Promise<Party> {
    await gridAdapter.updateWeaponPosition({
      partyId,
      id: gridWeaponId,
      position: newPosition
    })

    return partyAdapter.getByShortcode(partyId)
  }

  async swapWeapons(
    partyId: string,
    gridWeaponId1: string,
    gridWeaponId2: string,
    editKey?: string
  ): Promise<Party> {
    await gridAdapter.swapWeapons({
      partyId,
      sourceId: gridWeaponId1,
      targetId: gridWeaponId2
    })

    return partyAdapter.getByShortcode(partyId)
  }

  async updateWeaponUncap(
    gridWeaponId: string,
    uncapLevel?: number,
    transcendenceStep?: number,
    editKey?: string
  ): Promise<any> {
    return gridAdapter.updateWeaponUncap({
      id: gridWeaponId,
      partyId: 'unknown', // This is a design issue - needs partyId
      uncapLevel: uncapLevel ?? 3,
      transcendenceStep
    })
  }

  // Summon Grid Operations

  async addSummon(
    partyId: string,
    summonId: string,
    position: number,
    editKey?: string
  ): Promise<Party> {
    await gridAdapter.createSummon({
      partyId,
      summonId,
      position,
      uncapLevel: 0,
      transcendenceStage: 0
    })

    return partyAdapter.getByShortcode(partyId)
  }

  async replaceSummon(
    partyId: string,
    gridSummonId: string,
    newSummonId: string,
    editKey?: string
  ): Promise<Party> {
    // First remove the old summon
    await gridAdapter.deleteSummon({ id: gridSummonId, partyId })

    // Then add the new one
    return this.addSummon(partyId, newSummonId, 0, editKey)
  }

  async removeSummon(
    partyId: string,
    gridSummonId: string,
    editKey?: string
  ): Promise<Party> {
    await gridAdapter.deleteSummon({ id: gridSummonId, partyId })

    return partyAdapter.getByShortcode(partyId)
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
    editKey?: string
  ): Promise<Party> {
    await gridAdapter.updateSummon(gridSummonId, {
      position: updates.position,
      quickSummon: updates.quickSummon,
      uncapLevel: updates.uncapLevel,
      transcendenceStage: updates.transcendenceStep
    })

    return partyAdapter.getByShortcode(partyId)
  }

  async updateSummonUncap(
    gridSummonId: string,
    uncapLevel?: number,
    transcendenceStep?: number,
    editKey?: string
  ): Promise<any> {
    return gridAdapter.updateSummonUncap({
      id: gridSummonId,
      partyId: 'unknown', // This is a design issue - needs partyId
      uncapLevel: uncapLevel ?? 3,
      transcendenceStep
    })
  }

  // Character Grid Operations

  async addCharacter(
    partyId: string,
    characterId: string,
    position: number,
    editKey?: string
  ): Promise<GridUpdateResult> {
    try {
      await gridAdapter.createCharacter({
        partyId,
        characterId,
        position,
        uncapLevel: 0,
        transcendenceStage: 0
      })

      const party = await partyAdapter.getByShortcode(partyId)
      return { party }
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
    editKey?: string
  ): Promise<GridUpdateResult> {
    try {
      // First remove the old character
      await gridAdapter.deleteCharacter({ id: gridCharacterId, partyId })

      // Then add the new one
      return this.addCharacter(partyId, newCharacterId, 0, editKey)
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
    editKey?: string
  ): Promise<Party> {
    await gridAdapter.deleteCharacter({ id: gridCharacterId, partyId })

    return partyAdapter.getByShortcode(partyId)
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
    editKey?: string
  ): Promise<Party> {
    await gridAdapter.updateCharacter(gridCharacterId, {
      position: updates.position,
      uncapLevel: updates.uncapLevel,
      transcendenceStage: updates.transcendenceStep,
      perpetualModifiers: updates.perpetuity ? {} : undefined
    })

    return partyAdapter.getByShortcode(partyId)
  }

  async updateCharacterUncap(
    gridCharacterId: string,
    uncapLevel?: number,
    transcendenceStep?: number,
    editKey?: string
  ): Promise<any> {
    return gridAdapter.updateCharacterUncap({
      id: gridCharacterId,
      partyId: 'unknown', // This is a design issue - needs partyId
      uncapLevel: uncapLevel ?? 3,
      transcendenceStep
    })
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