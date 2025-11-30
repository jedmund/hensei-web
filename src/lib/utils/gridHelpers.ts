/**
 * Grid slot finding and helper utilities
 * Handles finding available positions in weapon, summon, and character grids
 */

import type { Party } from '$lib/types/api/party'
import { GridType } from '$lib/types/enums'

/** Sentinel value indicating no empty slot was found */
export const SLOT_NOT_FOUND = -999

export interface SlotRange {
	start: number
	end: number
	specialSlots?: number[] // e.g., mainhand (-1), friend summon (6)
}

/** Grid slot configuration for each grid type */
const GRID_CONFIGS: Record<GridType, SlotRange> = {
	[GridType.Weapon]: { start: 0, end: 8, specialSlots: [-1] }, // mainhand + 9 grid slots
	[GridType.Summon]: { start: 0, end: 5, specialSlots: [-1, 6] }, // main + 6 grid + friend
	[GridType.Character]: { start: 1, end: 4, specialSlots: [] } // 4 slots (1-4), position 0 is protagonist (not user-selectable)
}

/**
 * Finds the next empty slot in a grid
 *
 * @param party - Current party state
 * @param gridType - Type of grid to search (weapon, summon, or character)
 * @returns Position number of next empty slot, or SLOT_NOT_FOUND if grid is full
 *
 * @example
 * ```typescript
 * const nextSlot = findNextEmptySlot(party, GridType.Weapon)
 * if (nextSlot !== SLOT_NOT_FOUND) {
 *   selectedSlot = nextSlot
 * }
 * ```
 */
export function findNextEmptySlot(party: Party, gridType: GridType): number {
	const config = GRID_CONFIGS[gridType]
	const collection = getCollectionForType(party, gridType)

	// Check special slots first (e.g., mainhand, main summon)
	for (const specialSlot of config.specialSlots || []) {
		if (!isSlotOccupied(collection, specialSlot, gridType)) {
			return specialSlot
		}
	}

	// Check regular grid slots
	for (let i = config.start; i <= config.end; i++) {
		if (!isSlotOccupied(collection, i, gridType)) {
			return i
		}
	}

	return SLOT_NOT_FOUND
}

/**
 * Gets the appropriate collection array for a grid type
 */
function getCollectionForType(party: Party, gridType: GridType) {
	switch (gridType) {
		case GridType.Weapon:
			return party.weapons
		case GridType.Summon:
			return party.summons
		case GridType.Character:
			return party.characters
	}
}

/**
 * Checks if a specific slot position is occupied
 * Handles special cases for mainhand weapons, main/friend summons
 */
function isSlotOccupied(collection: any[], position: number, gridType: GridType): boolean {
	// For weapons, check both position and mainhand flag
	if (gridType === GridType.Weapon) {
		return collection.some(
			(item) => item.position === position || (position === -1 && item.mainhand)
		)
	}

	// For summons, check position, main, and friend flags
	if (gridType === GridType.Summon) {
		return collection.some(
			(item) =>
				item.position === position ||
				(position === -1 && item.main) ||
				(position === 6 && item.friend)
		)
	}

	// For characters, simple position check
	return collection.some((item) => item.position === position)
}
