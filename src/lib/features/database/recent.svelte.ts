/**
 * Remembers the last few database pages an editor opened
 * (localStorage only), for the overview page.
 */
import { browser } from '$app/environment'

export interface RecentPage {
	path: string
	title: string
	sectionId: string
	at: number
}

const KEY = 'hensei:database:recent:v2'
const LIMIT = 8

function load(): RecentPage[] {
	if (!browser) return []
	try {
		const raw = localStorage.getItem(KEY)
		return raw ? (JSON.parse(raw) as RecentPage[]) : []
	} catch {
		return []
	}
}

let pages = $state<RecentPage[]>(load())

export const recentPages = {
	get list() {
		return pages
	},
	record(entry: Omit<RecentPage, 'at'>) {
		pages = [{ ...entry, at: Date.now() }, ...pages.filter((p) => p.path !== entry.path)].slice(
			0,
			LIMIT
		)
		if (browser) localStorage.setItem(KEY, JSON.stringify(pages))
	},
	clear() {
		pages = []
		if (browser) localStorage.removeItem(KEY)
	}
}
