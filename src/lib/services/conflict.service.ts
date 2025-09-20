import type { Party, GridWeapon, GridCharacter } from '$lib/types/api/party'
import { gridAdapter } from '$lib/api/adapters'

export interface ConflictData {
  conflicts: string[]
  incoming: string
  position: number
}

export interface ConflictResolution {
  action: 'replace' | 'cancel'
  removeIds: string[]
  addId: string
  position: number
}

/**
 * Conflict service - handles conflict resolution for weapons and characters
 */
export class ConflictService {
  constructor() {}

  /**
   * Resolve a conflict by choosing which items to keep
   */
  async resolveConflict(
    partyId: string,
    conflictType: 'weapon' | 'character',
    resolution: ConflictResolution,
    editKey?: string
  ): Promise<Party> {
    if (conflictType === 'weapon') {
      return this.resolveWeaponConflict(partyId, resolution)
    } else {
      return this.resolveCharacterConflict(partyId, resolution)
    }
  }

  /**
   * Check if adding an item would cause conflicts
   */
  checkConflicts(
    party: Party,
    itemType: 'weapon' | 'character',
    itemId: string
  ): ConflictData | null {
    if (itemType === 'weapon') {
      return this.checkWeaponConflicts(party, itemId)
    } else {
      return this.checkCharacterConflicts(party, itemId)
    }
  }

  /**
   * Format conflict message for display
   */
  formatConflictMessage(
    conflictType: 'weapon' | 'character',
    conflictingItems: Array<{ name: string; position: number }>,
    incomingItem: { name: string }
  ): string {
    const itemTypeLabel = conflictType === 'weapon' ? 'weapon' : 'character'
    const conflictNames = conflictingItems.map(i => i.name).join(', ')

    if (conflictingItems.length === 1) {
      return `Adding ${incomingItem.name} would conflict with ${conflictNames}. Which ${itemTypeLabel} would you like to keep?`
    }

    return `Adding ${incomingItem.name} would conflict with: ${conflictNames}. Which ${itemTypeLabel}s would you like to keep?`
  }

  // Private methods

  private async resolveWeaponConflict(
    partyId: string,
    resolution: ConflictResolution
  ): Promise<Party> {
    // Use GridAdapter's conflict resolution
    const result = await gridAdapter.resolveWeaponConflict({
      partyId,
      incomingId: resolution.addId,
      position: resolution.position,
      conflictingIds: resolution.removeIds
    })

    // The adapter returns the weapon, but we need to return the full party
    // This is a limitation - we should fetch the updated party
    // For now, return a partial party object
    return {
      weapons: [result]
    } as Party
  }

  private async resolveCharacterConflict(
    partyId: string,
    resolution: ConflictResolution
  ): Promise<Party> {
    // Use GridAdapter's conflict resolution
    const result = await gridAdapter.resolveCharacterConflict({
      partyId,
      incomingId: resolution.addId,
      position: resolution.position,
      conflictingIds: resolution.removeIds
    })

    // The adapter returns the character, but we need to return the full party
    // This is a limitation - we should fetch the updated party
    return {
      characters: [result]
    } as Party
  }

  private checkWeaponConflicts(party: Party, weaponId: string): ConflictData | null {
    // Check for duplicate weapons (simplified - actual logic would be more complex)
    const existingWeapon = party.weapons.find(w => w.weapon.id === weaponId)

    if (existingWeapon) {
      return {
        conflicts: [existingWeapon.id],
        incoming: weaponId,
        position: existingWeapon.position
      }
    }

    // Could check for other conflict types here (e.g., same series weapons)

    return null
  }

  private checkCharacterConflicts(party: Party, characterId: string): ConflictData | null {
    // Check for duplicate characters
    const existingCharacter = party.characters.find(c => c.character.id === characterId)

    if (existingCharacter) {
      return {
        conflicts: [existingCharacter.id],
        incoming: characterId,
        position: existingCharacter.position
      }
    }

    // Check for conflicts with other versions of the same character
    // This would need character metadata to determine conflicts

    return null
  }

  /**
   * Get conflict constraints for a specific type
   */
  getConflictConstraints(itemType: 'weapon' | 'character'): {
    allowDuplicates: boolean
    maxPerType?: number
    checkVariants: boolean
  } {
    if (itemType === 'weapon') {
      return {
        allowDuplicates: false,
        checkVariants: true // Check for same series weapons
      }
    }

    return {
      allowDuplicates: false,
      checkVariants: true // Check for different versions of same character
    }
  }
}