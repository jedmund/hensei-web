/**
 * Utilities for preserving list navigation state
 * Stores the list URL when navigating to a detail page so the Back button
 * can return to the filtered list
 */

const STORAGE_KEY = 'database_list_url'

interface StoredListUrl {
	url: string
	resource: 'characters' | 'weapons' | 'summons' | 'jobs'
}

/**
 * Store the current list URL before navigating to a detail page
 */
export function storeListUrl(url: string, resource: 'characters' | 'weapons' | 'summons' | 'jobs'): void {
	try {
		const data: StoredListUrl = { url, resource }
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
	} catch {
		// sessionStorage not available
	}
}

/**
 * Get the stored list URL for a resource, or return the base path as fallback
 */
export function getListUrl(resource: 'characters' | 'weapons' | 'summons'): string {
	const basePath = `/database/${resource}`

	try {
		const stored = sessionStorage.getItem(STORAGE_KEY)
		if (stored) {
			const data: StoredListUrl = JSON.parse(stored)
			// Only use stored URL if it matches the current resource
			if (data.resource === resource) {
				return data.url
			}
		}
	} catch {
		// sessionStorage not available or invalid data
	}

	return basePath
}
