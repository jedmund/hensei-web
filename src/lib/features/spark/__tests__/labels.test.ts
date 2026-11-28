import { describe, expect, it } from 'vitest'
import type { CatalogueItem } from '$lib/types/gacha'
import type { SparkRenderData } from '$lib/types/spark'
import { drawnSsrCount, savedSparkName } from '../labels'

describe('savedSparkName', () => {
	it('names a spark by its date, season and pool', () => {
		expect(savedSparkName('2026-11-15', 'flash', 'halloween', 'en-US')).toBe(
			'11/15/2026 Halloween Flash Gala'
		)
		expect(savedSparkName('2026-11-15', 'premium', null, 'en-US')).toBe('11/15/2026 Premium Gala')
		expect(savedSparkName('2026-11-15', 'collab', null, 'en-US')).toBe('11/15/2026 Collab Gacha')
		expect(savedSparkName('2026-11-15', 'classic_ii', null, 'en-US')).toBe(
			'11/15/2026 Classic II Gacha'
		)
	})

	it('puts a season alone on the Premium Gala, and stands a date alone', () => {
		expect(savedSparkName('2026-11-15', null, 'summer', 'en-US')).toBe(
			'11/15/2026 Summer Premium Gala'
		)
		expect(savedSparkName('2026-11-15', null, null, 'en-US')).toBe('11/15/2026')
	})
})

describe('drawnSsrCount', () => {
	const item = {} as CatalogueItem
	it('leaves out every sparked item', () => {
		const data = {
			columns: { characters: [item, item, item], moons: [item], summons: [item] },
			sparked: [
				{ column: 'characters', index: 0 },
				{ column: 'summons', index: 0 }
			],
			draws: 300,
			date: null,
			pool: null,
			season: null
		} as SparkRenderData
		expect(drawnSsrCount(data)).toBe(3)
	})
})
