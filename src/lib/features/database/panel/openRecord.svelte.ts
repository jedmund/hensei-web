/**
 * The record showing in the database side panel, so the breadcrumb (which
 * lives outside the list's component tree) can treat it like a visited page.
 */

export interface OpenRecord {
	/** Full-page path (unlocalized) */
	path: string
	title: string
}

let current = $state<OpenRecord | null>(null)

export const openRecord = {
	get current() {
		return current
	},
	set(record: OpenRecord | null) {
		current = record
	}
}
