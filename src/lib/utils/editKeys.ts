/**
 * Edit key management utilities
 * Handles edit keys for anonymous party editing
 */

import type { Party } from '$lib/types/api/party'

const EDIT_KEY_PREFIX = 'party_edit_key_'

/**
 * Get edit key for a party from localStorage
 */
export function getEditKey(shortcode: string): string | null {
	if (typeof window === 'undefined') return null
	return localStorage.getItem(`${EDIT_KEY_PREFIX}${shortcode}`)
}

/**
 * Store edit key for a party in localStorage
 */
export function storeEditKey(shortcode: string, editKey: string): void {
	if (typeof window === 'undefined') return
	localStorage.setItem(`${EDIT_KEY_PREFIX}${shortcode}`, editKey)
}

/**
 * Remove edit key for a party from localStorage
 */
export function removeEditKey(shortcode: string): void {
	if (typeof window === 'undefined') return
	localStorage.removeItem(`${EDIT_KEY_PREFIX}${shortcode}`)
}

/**
 * Get all stored edit keys from localStorage
 */
export function getAllEditKeys(): Array<{ shortcode: string; editKey: string }> {
	if (typeof window === 'undefined') return []

	const keys: Array<{ shortcode: string; editKey: string }> = []
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i)
		if (key && key.startsWith(EDIT_KEY_PREFIX)) {
			const shortcode = key.slice(EDIT_KEY_PREFIX.length)
			const editKey = localStorage.getItem(key)
			if (editKey) {
				keys.push({ shortcode, editKey })
			}
		}
	}
	return keys
}

/**
 * Check if any edit keys are stored in localStorage
 */
export function hasEditKeys(): boolean {
	if (typeof window === 'undefined') return false
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i)
		if (key && key.startsWith(EDIT_KEY_PREFIX)) return true
	}
	return false
}

/**
 * Remove multiple edit keys from localStorage
 */
export function removeEditKeys(shortcodes: string[]): void {
	if (typeof window === 'undefined') return
	for (const shortcode of shortcodes) {
		localStorage.removeItem(`${EDIT_KEY_PREFIX}${shortcode}`)
	}
}

/**
 * Compute editability of a party based on ownership and edit keys
 */
export function computeEditability(
	party: Party,
	authUserId?: string,
	localId?: string,
	editKey?: string
): { canEdit: boolean; reason?: string } {
	// User is authenticated and owns the party
	if (authUserId && party.user?.id === authUserId) {
		return { canEdit: true }
	}

	// Anonymous user with matching local ID
	if (!authUserId && localId && party.localId === localId) {
		return { canEdit: true }
	}

	// Has valid edit key
	if (editKey && party.editKey === editKey) {
		return { canEdit: true }
	}

	// No edit permission
	return { canEdit: false, reason: 'Not authorized to edit this party' }
}
