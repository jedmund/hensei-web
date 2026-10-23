import { vi } from 'vitest'
import type { Cookies } from '@sveltejs/kit'

export interface CookieCall {
	name: string
	value?: string
	opts: Record<string, unknown>
}

/** An in-memory Cookies that records every set and delete. */
export function createMockCookies(initial: Record<string, string> = {}) {
	const store = new Map(Object.entries(initial))
	const sets: CookieCall[] = []
	const deletes: CookieCall[] = []

	const cookies = {
		get: vi.fn((name: string) => store.get(name)),
		getAll: vi.fn(() => [...store].map(([name, value]) => ({ name, value }))),
		set: vi.fn((name: string, value: string, opts: Record<string, unknown>) => {
			store.set(name, value)
			sets.push({ name, value, opts })
		}),
		delete: vi.fn((name: string, opts: Record<string, unknown>) => {
			store.delete(name)
			deletes.push({ name, opts })
		}),
		serialize: vi.fn(() => '')
	}

	return {
		cookies: cookies as unknown as Cookies,
		store,
		sets,
		deletes,
		lastSet: (name: string) => [...sets].reverse().find((c) => c.name === name)
	}
}
