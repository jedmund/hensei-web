import { describe, it, expect } from 'vitest'
import {
	addEntry,
	groupByDay,
	LOG_KEY,
	LOG_LIMIT,
	readLog,
	trimResult,
	writeLog,
	type GachaLogEntry
} from '../gachaLog'
import type { CatalogueItem, GachaResult } from '$lib/types/gacha'

const item = (identity: string, rarity: number) => ({ identity, rarity }) as CatalogueItem

const result = (seed: string): GachaResult =>
	({
		draws: '10',
		seed,
		configuration: { mode: 'premium' },
		ordered: [item('a', 3), item('b', 1)],
		items: [item('a', 3), item('b', 1), item('c', 2)],
		cost: { crystals: '3000', jpy: '3000', usd: null, label: '', exchange_rate: null }
	}) as unknown as GachaResult

const entry = (id: string): GachaLogEntry => ({
	id,
	at: 1,
	operation: 'draw',
	link: `seed=${id}`,
	result: result(id)
})

/** In-memory Storage that can be told to refuse writes over a size */
function memoryStorage(limit = Infinity): Storage {
	const data = new Map<string, string>()
	return {
		get length() {
			return data.size
		},
		clear: () => data.clear(),
		key: (index) => [...data.keys()][index] ?? null,
		getItem: (key) => data.get(key) ?? null,
		removeItem: (key) => void data.delete(key),
		setItem: (key, value) => {
			if (value.length > limit) throw new DOMException('Full', 'QuotaExceededError')
			data.set(key, value)
		}
	}
}

describe('trimResult', () => {
	it('keeps only the SSRs and drops the per-draw order', () => {
		const trimmed = trimResult(result('x'))
		expect(trimmed.items).toEqual([item('a', 3)])
		expect(trimmed).not.toHaveProperty('ordered')
		expect(trimmed.seed).toBe('x')
	})
})

describe('addEntry', () => {
	it('adds to the top, replaces a repeat and keeps the newest LOG_LIMIT', () => {
		let log: GachaLogEntry[] = []
		for (let i = 0; i < LOG_LIMIT + 5; i++) log = addEntry(log, entry(`s${i}`))
		expect(log).toHaveLength(LOG_LIMIT)
		expect(log[0]?.id).toBe(`s${LOG_LIMIT + 4}`)
		log = addEntry(log, entry('s10'))
		expect(log[0]?.id).toBe('s10')
		expect(log.filter((e) => e.id === 's10')).toHaveLength(1)
	})
})

describe('readLog / writeLog', () => {
	it('round-trips the log and clears the key when empty', () => {
		const storage = memoryStorage()
		writeLog(storage, [entry('a'), entry('b')])
		expect(readLog(storage).map((e) => e.id)).toEqual(['a', 'b'])
		writeLog(storage, [])
		expect(storage.getItem(LOG_KEY)).toBeNull()
	})

	it('ignores malformed data', () => {
		const storage = memoryStorage()
		storage.setItem(LOG_KEY, 'not json')
		expect(readLog(storage)).toEqual([])
		storage.setItem(LOG_KEY, JSON.stringify([{ id: 1 }, entry('ok')]))
		expect(readLog(storage).map((e) => e.id)).toEqual(['ok'])
	})

	it('drops the oldest entries until the log fits', () => {
		const one = JSON.stringify([entry('a')]).length
		const storage = memoryStorage(one * 3)
		const saved = writeLog(
			storage,
			Array.from({ length: 8 }, (_, i) => entry(`s${i}`))
		)
		expect(saved.length).toBeLessThan(8)
		expect(saved[0]?.id).toBe('s0')
		expect(readLog(storage)).toHaveLength(saved.length)
	})
})

describe('groupByDay', () => {
	it('splits the log into local days, keeping its order', () => {
		const at = (day: number, hour: number) => new Date(2026, 9, day, hour).getTime()
		const log = [at(11, 20), at(11, 9), at(10, 23), at(8, 1)].map((time, i) => ({
			...entry(`s${i}`),
			at: time
		}))
		const days = groupByDay(log)
		expect(days.map((d) => d.day)).toEqual([
			new Date(2026, 9, 11).getTime(),
			new Date(2026, 9, 10).getTime(),
			new Date(2026, 9, 8).getTime()
		])
		expect(days.map((d) => d.entries.map((e) => e.id))).toEqual([['s0', 's1'], ['s2'], ['s3']])
	})
})
