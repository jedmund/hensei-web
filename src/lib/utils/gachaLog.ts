/**
 * The gacha simulator's draw log: the viewer's past Draw and Until results,
 * newest first, saved in this browser. Each entry keeps what its result card
 * needs, so an entry opens without running the simulation again.
 */

import type { CatalogueItem, GachaResult } from '$lib/types/gacha'

export interface GachaLogEntry {
	/** The result's seed; one entry per result */
	id: string
	/** When it was drawn, in ms since the epoch */
	at: number
	operation: 'draw' | 'until'
	/** Query string of the settings plus the seed, for Share and Copy */
	link: string
	result: GachaResult
	/** The Until target */
	target?: CatalogueItem
	/** Repeat SSR characters drawn, counted when the draw ran */
	goldMoons?: number
}

export const LOG_KEY = 'gacha:log'
export const LOG_LIMIT = 50

/**
 * Keeps only what the result card shows: the SSRs among the items, and no
 * per-draw order. Long runs would otherwise fill the browser's storage.
 */
export function trimResult(result: GachaResult): GachaResult {
	const trimmed = { ...result, items: (result.items ?? []).filter((item) => item.rarity === 3) }
	delete trimmed.ordered
	return trimmed
}

/** The log with an entry added at the top, replacing an older copy of it */
export function addEntry(log: GachaLogEntry[], entry: GachaLogEntry): GachaLogEntry[] {
	return [entry, ...log.filter((other) => other.id !== entry.id)].slice(0, LOG_LIMIT)
}

function isEntry(value: unknown): value is GachaLogEntry {
	const entry = value as GachaLogEntry | null
	return (
		typeof entry?.id === 'string' &&
		typeof entry.at === 'number' &&
		(entry.operation === 'draw' || entry.operation === 'until') &&
		typeof entry.link === 'string' &&
		typeof entry.result?.seed === 'string' &&
		typeof entry.result.draws === 'string'
	)
}

export interface GachaLogDay {
	/** Local midnight of the day, in ms since the epoch */
	day: number
	entries: GachaLogEntry[]
}

/** The log split into days in the viewer's time zone, keeping its order */
export function groupByDay(log: GachaLogEntry[]): GachaLogDay[] {
	const days: GachaLogDay[] = []
	for (const entry of log) {
		const day = new Date(entry.at).setHours(0, 0, 0, 0)
		const last = days.at(-1)
		if (last?.day === day) last.entries.push(entry)
		else days.push({ day, entries: [entry] })
	}
	return days
}

/** The saved log; empty when storage is unavailable or holds something else */
export function readLog(storage: Storage): GachaLogEntry[] {
	try {
		const saved = JSON.parse(storage.getItem(LOG_KEY) ?? '[]')
		return Array.isArray(saved) ? saved.filter(isEntry).slice(0, LOG_LIMIT) : []
	} catch {
		return []
	}
}

/**
 * Saves the log. When it doesn't fit, the oldest entries are dropped until
 * it does. Returns what was saved.
 */
export function writeLog(storage: Storage, log: GachaLogEntry[]): GachaLogEntry[] {
	let entries = log
	for (;;) {
		try {
			if (entries.length === 0) storage.removeItem(LOG_KEY)
			else storage.setItem(LOG_KEY, JSON.stringify(entries))
			return entries
		} catch {
			// Storage unavailable (private mode) or full
			if (entries.length <= 1) return entries
			entries = entries.slice(0, Math.ceil(entries.length / 2))
		}
	}
}
