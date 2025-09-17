import type { Party, GridWeapon, GridSummon, GridCharacter } from '$lib/types/api/party'
import * as partiesApi from '$lib/api/resources/parties'
import * as gridApi from '$lib/api/resources/grid'
import type { FetchLike } from '$lib/api/core'

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
  constructor(private fetch: FetchLike) {}
  
  // Weapon Grid Operations
  
  async addWeapon(
    partyId: string,
    weaponId: string,
    position: number,
    editKey?: string
  ): Promise<GridUpdateResult> {
    const payload = {
      weaponId,
      position,
      uncapLevel: 0,
      transcendenceLevel: 0
    }
    
    try {
      const party = await partiesApi.updateWeaponGrid(
        this.fetch,
        partyId,
        payload,
        this.buildHeaders(editKey)
      )
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
    const payload = {
      id: gridWeaponId,
      weaponId: newWeaponId
    }
    
    try {
      const party = await partiesApi.updateWeaponGrid(
        this.fetch,
        partyId,
        payload,
        this.buildHeaders(editKey)
      )
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
  
  async removeWeapon(
    partyId: string,
    gridWeaponId: string,
    editKey?: string
  ): Promise<Party> {
    const payload = {
      id: gridWeaponId,
      _destroy: true
    }
    
    return partiesApi.updateWeaponGrid(
      this.fetch,
      partyId,
      payload,
      this.buildHeaders(editKey)
    )
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
    const payload = {
      id: gridWeaponId,
      ...updates
    }

    return partiesApi.updateWeaponGrid(
      this.fetch,
      partyId,
      payload,
      this.buildHeaders(editKey)
    )
  }

  async moveWeapon(
    partyId: string,
    gridWeaponId: string,
    newPosition: number,
    editKey?: string
  ): Promise<Party> {
    const payload = {
      id: gridWeaponId,
      position: newPosition
    }

    return partiesApi.updateWeaponGrid(
      this.fetch,
      partyId,
      payload,
      this.buildHeaders(editKey)
    )
  }
  
  async swapWeapons(
    partyId: string,
    gridWeaponId1: string,
    gridWeaponId2: string,
    editKey?: string
  ): Promise<Party> {
    const payload = {
      swap: [gridWeaponId1, gridWeaponId2]
    }
    
    return partiesApi.updateWeaponGrid(
      this.fetch,
      partyId,
      payload,
      this.buildHeaders(editKey)
    )
  }
  
  async updateWeaponUncap(
    gridWeaponId: string,
    uncapLevel?: number,
    transcendenceStep?: number,
    editKey?: string
  ): Promise<any> {
    return gridApi.updateWeaponUncap(
      gridWeaponId,
      uncapLevel,
      transcendenceStep,
      this.buildHeaders(editKey)
    )
  }
  
  // Summon Grid Operations
  
  async addSummon(
    partyId: string,
    summonId: string,
    position: number,
    editKey?: string
  ): Promise<Party> {
    const payload = {
      summonId,
      position,
      uncapLevel: 0,
      transcendenceLevel: 0
    }
    
    return partiesApi.updateSummonGrid(
      this.fetch,
      partyId,
      payload,
      this.buildHeaders(editKey)
    )
  }
  
  async replaceSummon(
    partyId: string,
    gridSummonId: string,
    newSummonId: string,
    editKey?: string
  ): Promise<Party> {
    const payload = {
      id: gridSummonId,
      summonId: newSummonId
    }
    
    return partiesApi.updateSummonGrid(
      this.fetch,
      partyId,
      payload,
      this.buildHeaders(editKey)
    )
  }
  
  async removeSummon(
    partyId: string,
    gridSummonId: string,
    editKey?: string
  ): Promise<Party> {
    const payload = {
      id: gridSummonId,
      _destroy: true
    }

    return partiesApi.updateSummonGrid(
      this.fetch,
      partyId,
      payload,
      this.buildHeaders(editKey)
    )
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
    const payload = {
      id: gridSummonId,
      ...updates
    }

    return partiesApi.updateSummonGrid(
      this.fetch,
      partyId,
      payload,
      this.buildHeaders(editKey)
    )
  }
  
  async updateSummonUncap(
    gridSummonId: string,
    uncapLevel?: number,
    transcendenceStep?: number,
    editKey?: string
  ): Promise<any> {
    return gridApi.updateSummonUncap(
      gridSummonId,
      uncapLevel,
      transcendenceStep,
      this.buildHeaders(editKey)
    )
  }
  
  // Character Grid Operations
  
  async addCharacter(
    partyId: string,
    characterId: string,
    position: number,
    editKey?: string
  ): Promise<GridUpdateResult> {
    const payload = {
      characterId,
      position,
      uncapLevel: 0,
      transcendenceLevel: 0
    }
    
    try {
      const party = await partiesApi.updateCharacterGrid(
        this.fetch,
        partyId,
        payload,
        this.buildHeaders(editKey)
      )
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
    const payload = {
      id: gridCharacterId,
      characterId: newCharacterId
    }
    
    try {
      const party = await partiesApi.updateCharacterGrid(
        this.fetch,
        partyId,
        payload,
        this.buildHeaders(editKey)
      )
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
  
  async removeCharacter(
    partyId: string,
    gridCharacterId: string,
    editKey?: string
  ): Promise<Party> {
    const payload = {
      id: gridCharacterId,
      _destroy: true
    }

    return partiesApi.updateCharacterGrid(
      this.fetch,
      partyId,
      payload,
      this.buildHeaders(editKey)
    )
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
    const payload = {
      id: gridCharacterId,
      ...updates
    }

    return partiesApi.updateCharacterGrid(
      this.fetch,
      partyId,
      payload,
      this.buildHeaders(editKey)
    )
  }
  
  async updateCharacterUncap(
    gridCharacterId: string,
    uncapLevel?: number,
    transcendenceStep?: number,
    editKey?: string
  ): Promise<any> {
    return gridApi.updateCharacterUncap(
      gridCharacterId,
      uncapLevel,
      transcendenceStep,
      this.buildHeaders(editKey)
    )
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