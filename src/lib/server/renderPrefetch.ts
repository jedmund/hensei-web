/**
 * In-process handoff between an authenticated render request (e.g. the
 * download endpoint) and the internal SSR route Playwright navigates to.
 *
 * The renderer's HTTP request to the internal route carries no user cookies,
 * so any data that requires the caller's session must be pre-fetched on the
 * authenticated side and stashed somewhere the SSR route can pick it up.
 * A short-TTL Map keyed by a one-shot token works because the SvelteKit
 * Node server and the Playwright singleton share a process today.
 *
 * If we ever split Playwright into its own service (deferred per the plan),
 * this needs to move to a shared store. Keeping the interface narrow now so
 * the migration is mechanical.
 */

import { randomUUID } from 'node:crypto'

const TTL_MS = 30_000
const MAX_ENTRIES = 256

interface Entry<T = unknown> {
	data: T
	expiresAt: number
}

const store = new Map<string, Entry>()

function sweepExpired(): void {
	const now = Date.now()
	for (const [token, entry] of store) {
		if (entry.expiresAt < now) store.delete(token)
	}
}

/**
 * Stash `data` under a freshly-minted token. The token is single-use:
 * consuming it removes the entry. If the renderer never consumes it, the
 * entry is reaped after TTL_MS.
 */
export function storePrefetch<T>(data: T): string {
	sweepExpired()
	// Defense against an unbounded leak if some pathway is creating tokens
	// without consumers ever picking them up.
	if (store.size >= MAX_ENTRIES) {
		const oldest = store.keys().next().value
		if (oldest) store.delete(oldest)
	}
	const token = randomUUID()
	store.set(token, { data, expiresAt: Date.now() + TTL_MS })
	return token
}

/**
 * Consume a prefetch token. Returns the stashed data once, then deletes the
 * entry — so a leaked token can't be replayed. Returns null on a miss
 * (unknown token or expired entry).
 */
export function consumePrefetch<T>(token: string | null | undefined): T | null {
	if (!token) return null
	const entry = store.get(token)
	if (!entry) return null
	store.delete(token)
	if (entry.expiresAt < Date.now()) return null
	return entry.data as T
}

/** Test-only: reset the store between cases. */
export function _resetPrefetchStoreForTests(): void {
	store.clear()
}
