/**
 * Party visibility values
 *
 * These determine who can view a party:
 * - 1 (PUBLIC): Anyone can see it
 * - 2 (UNLISTED): Anyone with the link can see it (not in public listings)
 * - 3 (PRIVATE): Only the owner can see it
 */
export const PartyVisibility = {
	PUBLIC: 1,
	UNLISTED: 2,
	PRIVATE: 3
} as const

export type PartyVisibility = (typeof PartyVisibility)[keyof typeof PartyVisibility]
