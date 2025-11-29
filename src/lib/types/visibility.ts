/**
 * Party visibility values
 *
 * These determine who can view a party:
 * - public: Anyone can see it
 * - private: Only the owner can see it
 * - unlisted: Anyone with the link can see it (not in public listings)
 */
export const PartyVisibility = {
	PUBLIC: 'public',
	PRIVATE: 'private',
	UNLISTED: 'unlisted'
} as const

export type PartyVisibility = (typeof PartyVisibility)[keyof typeof PartyVisibility]

/**
 * Legacy mapping from numeric visibility values to string literals
 * Used for backward compatibility when reading from API
 *
 * @deprecated New code should use string literals directly
 */
export function numericToVisibility(value: number): PartyVisibility {
	const map: Record<number, PartyVisibility> = {
		0: PartyVisibility.PUBLIC,
		1: PartyVisibility.PRIVATE,
		2: PartyVisibility.UNLISTED
	}
	return map[value] ?? PartyVisibility.PUBLIC
}

/**
 * Convert visibility string to numeric value for API compatibility
 *
 * @deprecated Should be removed once API accepts string literals
 */
export function visibilityToNumeric(value: PartyVisibility): number {
	const map: Record<PartyVisibility, number> = {
		[PartyVisibility.PUBLIC]: 0,
		[PartyVisibility.PRIVATE]: 1,
		[PartyVisibility.UNLISTED]: 2
	}
	return map[value]
}
