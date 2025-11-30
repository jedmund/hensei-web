/**
 * Local ID utilities for anonymous users
 */

/**
 * Get or create a local ID for anonymous users
 * This ID persists in localStorage and allows anonymous users to manage their parties
 *
 * @returns Local ID string (UUID)
 */
export function getLocalId(): string {
	if (typeof window === 'undefined') return ''

	let localId = localStorage.getItem('local_id')
	if (!localId) {
		localId = crypto.randomUUID()
		localStorage.setItem('local_id', localId)
	}
	return localId
}
