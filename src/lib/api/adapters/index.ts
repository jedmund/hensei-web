/**
 * Main export file for the adapter system
 *
 * This module re-exports all public APIs from the adapter system,
 * providing a single entry point for consumers.
 *
 * @module adapters
 */

// Core exports
export { BaseAdapter } from './base.adapter'
export * from './types'
export * from './errors'

// Resource-specific adapters
export { SearchAdapter, searchAdapter } from './search.adapter'
export type { SearchParams, SearchResult, SearchResponse } from './search.adapter'

export { PartyAdapter, partyAdapter } from './party.adapter'
export type {
	Party,
	GridWeapon,
	GridSummon,
	GridCharacter,
	CreatePartyParams,
	UpdatePartyParams,
	ListUserPartiesParams,
	UpdateGridParams,
	GridWeaponUpdate,
	GridSummonUpdate,
	GridCharacterUpdate,
	ConflictResolution
} from './party.adapter'

// export { GridAdapter } from './grid.adapter'
// export { EntityAdapter } from './entity.adapter'

// Reactive resources using Svelte 5 runes
export * from './resources'