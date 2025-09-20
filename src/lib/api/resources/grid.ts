/**
 * Grid API resource functions - Facade layer for migration
 *
 * This module provides backward compatibility during the migration
 * from api/core to the adapter pattern. Services can continue using
 * these functions while we migrate them incrementally.
 */

import { gridAdapter } from '$lib/api/adapters'
import type {
	GridWeapon,
	GridCharacter,
	GridSummon
} from '$lib/api/adapters'

// FetchLike type for backward compatibility
export type FetchLike = typeof fetch

// Weapon grid operations
export async function addWeapon(
  fetch: FetchLike,
  partyId: string,
  weaponId: string, // Granblue ID
  position: number,
  options?: {
    mainhand?: boolean
    uncapLevel?: number
    transcendenceStep?: number
    element?: number
  },
  headers?: Record<string, string>
): Promise<GridWeapon> {
  return gridAdapter.createWeapon({
    partyId,
    weaponId,
    position,
    mainhand: position === -1 || options?.mainhand,
    uncapLevel: options?.uncapLevel ?? 3,
    transcendenceStage: options?.transcendenceStep ?? 0
  })
}

export async function updateWeapon(
  fetch: FetchLike,
  partyId: string,
  gridWeaponId: string,
  updates: {
    position?: number
    uncapLevel?: number
    transcendenceStep?: number
    element?: number
  },
  headers?: Record<string, string>
): Promise<GridWeapon> {
  return gridAdapter.updateWeapon(gridWeaponId, {
    position: updates.position,
    uncapLevel: updates.uncapLevel,
    transcendenceStage: updates.transcendenceStep,
    element: updates.element
  })
}

export async function removeWeapon(
  fetch: FetchLike,
  partyId: string,
  gridWeaponId: string,
  headers?: Record<string, string>
): Promise<void> {
  return gridAdapter.deleteWeapon({
    id: gridWeaponId,
    partyId
  })
}

// Summon grid operations
export async function addSummon(
  fetch: FetchLike,
  partyId: string,
  summonId: string, // Granblue ID
  position: number,
  options?: {
    main?: boolean
    friend?: boolean
    quickSummon?: boolean
    uncapLevel?: number
    transcendenceStep?: number
  },
  headers?: Record<string, string>
): Promise<GridSummon> {
  return gridAdapter.createSummon({
    partyId,
    summonId,
    position,
    main: position === -1 || options?.main,
    friend: position === 6 || options?.friend,
    quickSummon: options?.quickSummon ?? false,
    uncapLevel: options?.uncapLevel ?? 3,
    transcendenceStage: options?.transcendenceStep ?? 0
  })
}

export async function updateSummon(
  fetch: FetchLike,
  partyId: string,
  gridSummonId: string,
  updates: {
    position?: number
    quickSummon?: boolean
    uncapLevel?: number
    transcendenceStep?: number
  },
  headers?: Record<string, string>
): Promise<GridSummon> {
  return gridAdapter.updateSummon(gridSummonId, {
    position: updates.position,
    quickSummon: updates.quickSummon,
    uncapLevel: updates.uncapLevel,
    transcendenceStage: updates.transcendenceStep
  })
}

export async function removeSummon(
  fetch: FetchLike,
  partyId: string,
  gridSummonId: string,
  headers?: Record<string, string>
): Promise<void> {
  return gridAdapter.deleteSummon({
    id: gridSummonId,
    partyId
  })
}

// Character grid operations
export async function addCharacter(
  fetch: FetchLike,
  partyId: string,
  characterId: string, // Granblue ID
  position: number,
  options?: {
    uncapLevel?: number
    transcendenceStep?: number
    perpetuity?: boolean
  },
  headers?: Record<string, string>
): Promise<GridCharacter> {
  return gridAdapter.createCharacter({
    partyId,
    characterId,
    position,
    uncapLevel: options?.uncapLevel ?? 3,
    transcendenceStage: options?.transcendenceStep ?? 0
  })
}

export async function updateCharacter(
  fetch: FetchLike,
  partyId: string,
  gridCharacterId: string,
  updates: {
    position?: number
    uncapLevel?: number
    transcendenceStep?: number
    perpetuity?: boolean
  },
  headers?: Record<string, string>
): Promise<GridCharacter> {
  return gridAdapter.updateCharacter(gridCharacterId, {
    position: updates.position,
    uncapLevel: updates.uncapLevel,
    transcendenceStage: updates.transcendenceStep,
    perpetualModifiers: updates.perpetuity ? {} : undefined
  })
}

export async function removeCharacter(
  fetch: FetchLike,
  partyId: string,
  gridCharacterId: string,
  headers?: Record<string, string>
): Promise<void> {
  return gridAdapter.deleteCharacter({
    id: gridCharacterId,
    partyId
  })
}

// Uncap update methods - these use special endpoints
export async function updateCharacterUncap(
  gridCharacterId: string,
  uncapLevel?: number,
  transcendenceStep?: number,
  headers?: Record<string, string>
): Promise<GridCharacter> {
  // For uncap updates, we need the partyId which isn't passed here
  // This is a limitation of the current API design
  // For now, we'll use the update method with a fake partyId
  return gridAdapter.updateCharacterUncap({
    id: gridCharacterId,
    partyId: 'unknown', // This is a hack - the API should be redesigned
    uncapLevel: uncapLevel ?? 3,
    transcendenceStep
  })
}

export async function updateWeaponUncap(
  gridWeaponId: string,
  uncapLevel?: number,
  transcendenceStep?: number,
  headers?: Record<string, string>
): Promise<GridWeapon> {
  return gridAdapter.updateWeaponUncap({
    id: gridWeaponId,
    partyId: 'unknown', // This is a hack - the API should be redesigned
    uncapLevel: uncapLevel ?? 3,
    transcendenceStep
  })
}

export async function updateSummonUncap(
  gridSummonId: string,
  uncapLevel?: number,
  transcendenceStep?: number,
  headers?: Record<string, string>
): Promise<GridSummon> {
  return gridAdapter.updateSummonUncap({
    id: gridSummonId,
    partyId: 'unknown', // This is a hack - the API should be redesigned
    uncapLevel: uncapLevel ?? 3,
    transcendenceStep
  })
}