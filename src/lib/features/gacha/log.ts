/**
 * The page's side of the draw log: the entry a result makes, and reading and
 * saving through `localStorage` when it's there. The log's own rules live in
 * `$lib/utils/gachaLog`.
 */

import { goldMoonCount } from '$lib/gacha-animation/moons'
import { readLog, trimResult, writeLog, type GachaLogEntry } from '$lib/utils/gachaLog'
import type { CatalogueItem, GachaResult } from '$lib/types/gacha'

/** The log entry for a Draw or Until result started on the page */
export function logEntry(
	operation: GachaLogEntry['operation'],
	result: GachaResult,
	link: string,
	items: CatalogueItem[],
	owned: ReadonlySet<string> | undefined,
	at = Date.now()
): GachaLogEntry {
	return {
		id: result.seed,
		at,
		operation,
		link,
		result: trimResult(result),
		target: items.find((item) => item.identity === result.target),
		goldMoons: goldMoonCount(result.items ?? [], owned)
	}
}

/** The saved log; empty without storage */
export function loadLog(): GachaLogEntry[] {
	try {
		return readLog(localStorage)
	} catch {
		return []
	}
}

/** Saves the log and returns what was kept; without storage, keeps it for this visit */
export function storeLog(entries: GachaLogEntry[]): GachaLogEntry[] {
	try {
		return writeLog(localStorage, entries)
	} catch {
		return entries
	}
}
