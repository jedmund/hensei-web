/**
 * Param types shared by the grid weapon, character and summon adapters.
 *
 * @module adapters/grid.shared
 */

/**
 * Parameters for updating uncap levels
 */
export interface UpdateUncapParams {
	id?: string | undefined
	partyId: string
	position?: number | undefined
	uncapLevel: number
	transcendenceStep?: number | undefined
}

/**
 * Parameters for updating positions
 */
export interface UpdatePositionParams {
	partyId: string
	id: string
	position: number
	container?: string
}

/**
 * Parameters for swapping positions
 */
export interface SwapPositionsParams {
	partyId: string
	sourceId: string
	targetId: string
}

/**
 * Conflict resolution parameters
 */
export interface ResolveConflictParams {
	partyId: string
	incoming: string
	position: number
	conflicting: string[]
}
