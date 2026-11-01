import { afterEach, describe, it, expect, vi } from 'vitest'
import { loadLog, logEntry, storeLog } from '../log'
import { LOG_KEY, type GachaLogEntry } from '$lib/utils/gachaLog'
import type { CatalogueItem, GachaResult } from '$lib/types/gacha'

const character = (identity: string, rarity: number, granblue_id: string) =>
	({ identity, rarity, recruits: { granblue_id, en: '', ja: '' } }) as CatalogueItem

const result = {
	draws: '10',
	seed: 'abc',
	target: 'Weapon:2',
	configuration: { mode: 'premium' },
	items: [character('Weapon:1', 3, '3040001000'), character('Weapon:3', 1, '3020001000')],
	ordered: [],
	cost: { crystals: '3000', jpy: '3000', usd: null, label: '', exchange_rate: null }
} as unknown as GachaResult

function memoryStorage(): Storage {
	const values = new Map<string, string>()
	return {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => void values.set(key, value),
		removeItem: (key) => void values.delete(key),
		clear: () => values.clear(),
		key: () => null,
		get length() {
			return values.size
		}
	}
}

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('logEntry', () => {
	const items = [character('Weapon:2', 3, '3040002000')]

	it('keeps the trimmed result, its link and target', () => {
		const entry = logEntry('until', result, 'op=until&seed=abc', items, undefined, 42)
		expect(entry).toMatchObject({
			id: 'abc',
			at: 42,
			operation: 'until',
			link: 'op=until&seed=abc',
			target: items[0]
		})
		expect(entry.result.items?.map((item) => item.identity)).toEqual(['Weapon:1'])
		expect(entry.result).not.toHaveProperty('ordered')
	})

	it('counts gold moons against the viewer’s characters', () => {
		const owned = new Set(['3040001000'])
		expect(logEntry('draw', result, '', [], owned).goldMoons).toBe(1)
		expect(logEntry('draw', result, '', [], undefined).goldMoons).toBe(0)
	})
})

describe('loadLog and storeLog', () => {
	const entry = logEntry('draw', result, 'seed=abc', [], undefined, 1) as GachaLogEntry

	it('round-trip through storage', () => {
		const storage = memoryStorage()
		vi.stubGlobal('localStorage', storage)
		expect(storeLog([entry])).toEqual([entry])
		expect(storage.getItem(LOG_KEY)).not.toBeNull()
		expect(loadLog()).toEqual([entry])
		expect(storeLog([])).toEqual([])
		expect(storage.getItem(LOG_KEY)).toBeNull()
	})

	it('keep the log for the visit without storage', () => {
		vi.stubGlobal('localStorage', undefined)
		expect(loadLog()).toEqual([])
		expect(storeLog([entry])).toEqual([entry])
	})
})
