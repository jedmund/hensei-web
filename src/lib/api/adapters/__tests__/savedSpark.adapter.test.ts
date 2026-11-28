/**
 * Tests for SavedSparkAdapter and the conversion between a saved spark and
 * the spark maker's Spark.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
	SavedSparkAdapter,
	formatSparkDate,
	fromSavedSpark,
	isSparkDate,
	toSavedSparkPayload,
	todaySparkDate
} from '../savedSpark.adapter'
import { emptySpark, type Spark } from '$lib/features/spark/spark'
import type { SavedSpark } from '$lib/types/api/savedSpark'

const spark: Spark = {
	characters: ['1040000000', '1040000100'],
	moons: ['1040000200'],
	summons: ['2040000000'],
	sparked: [{ column: 'characters', index: 1 }],
	draws: 600,
	date: '2026-11-20',
	pool: 'flash',
	season: 'halloween'
}

// The API's saved spark: the spark's fields, with its date as sparkDate
const saved: SavedSpark = {
	id: 'spark-1',
	sparkDate: '2026-11-20',
	characters: spark.characters,
	moons: spark.moons,
	summons: spark.summons,
	sparkedMarks: spark.sparked,
	draws: spark.draws,
	pool: spark.pool,
	season: spark.season,
	createdAt: '2026-11-20T10:00:00Z',
	updatedAt: '2026-11-20T10:00:00Z'
}

// The API's snake_case form of `saved`
const apiSpark = {
	id: 'spark-1',
	spark_date: '2026-11-20',
	draws: 600,
	pool: 'flash',
	season: 'halloween',
	characters: ['1040000000', '1040000100'],
	moons: ['1040000200'],
	summons: ['2040000000'],
	sparked_marks: [{ column: 'characters', index: 1 }],
	created_at: '2026-11-20T10:00:00Z',
	updated_at: '2026-11-20T10:00:00Z'
}

describe('saved spark conversion', () => {
	it('builds the payload from a spark and its date', () => {
		expect(toSavedSparkPayload(spark, '2026-11-20')).toEqual({
			sparkDate: '2026-11-20',
			characters: ['1040000000', '1040000100'],
			moons: ['1040000200'],
			summons: ['2040000000'],
			sparkedMarks: [{ column: 'characters', index: 1 }],
			draws: 600,
			pool: 'flash',
			season: 'halloween'
		})
	})

	it('copies the lists so later edits to the spark do not leak in', () => {
		const payload = toSavedSparkPayload(spark, '2026-11-20')
		expect(payload.characters).not.toBe(spark.characters)
		expect(payload.sparkedMarks).not.toBe(spark.sparked)
	})

	it('sends no marks for a spark with nothing sparked', () => {
		expect(toSavedSparkPayload(emptySpark(), '2026-11-20')).toMatchObject({
			sparkedMarks: [],
			characters: [],
			draws: 300
		})
	})

	it('reads a saved spark back into a spark and its date', () => {
		expect(fromSavedSpark(saved)).toEqual({ spark, sparkDate: '2026-11-20' })
	})

	it('round-trips a mark in each column', () => {
		for (const sparked of [
			{ column: 'characters', index: 0 },
			{ column: 'moons', index: 0 },
			{ column: 'summons', index: 0 }
		] as const) {
			const payload = toSavedSparkPayload({ ...spark, sparked: [sparked] }, '2026-11-20')
			const back = fromSavedSpark({ ...saved, ...payload })
			expect(back.spark.sparked).toEqual([sparked])
		}
	})

	it('round-trips an empty spark and the default draws', () => {
		const payload = toSavedSparkPayload(emptySpark(), '2026-01-01')
		expect(fromSavedSpark({ ...saved, ...payload })).toEqual({
			spark: { ...emptySpark(), date: '2026-01-01' },
			sparkDate: '2026-01-01'
		})
	})

	it('drops what the spark maker would reject', () => {
		const { spark: read } = fromSavedSpark({
			...saved,
			characters: ['1040000000', '2040000000', 'junk'],
			summons: ['1040000000'],
			sparkedMarks: [{ column: 'summons', index: 0 }],
			draws: 0
		})
		expect(read.characters).toEqual(['1040000000'])
		expect(read.summons).toEqual([])
		expect(read.sparked).toEqual([])
		expect(read.draws).toBe(300)
	})
})

describe('spark dates', () => {
	it('formats the local day, not the UTC one', () => {
		// Late evening west of UTC is already the next day in UTC
		expect(formatSparkDate(new Date(2026, 10, 27, 23, 30))).toBe('2026-11-27')
		expect(todaySparkDate(new Date(2026, 0, 5, 0, 5))).toBe('2026-01-05')
	})

	it('accepts only real days as YYYY-MM-DD', () => {
		expect(isSparkDate('2026-02-28')).toBe(true)
		expect(isSparkDate('2028-02-29')).toBe(true)
		expect(isSparkDate('2026-02-29')).toBe(false)
		expect(isSparkDate('2026-13-01')).toBe(false)
		expect(isSparkDate('2026-1-01')).toBe(false)
		expect(isSparkDate('')).toBe(false)
	})
})

describe('SavedSparkAdapter', () => {
	let adapter: SavedSparkAdapter
	let originalFetch: typeof global.fetch

	const respond = (body: unknown, status = 200) => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			status,
			json: async () => body
		})
	}
	const lastCall = () => vi.mocked(global.fetch).mock.calls.at(-1) as [string, RequestInit]

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new SavedSparkAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
	})

	it('lists sparks with the page and page size', async () => {
		respond({ results: [apiSpark], meta: { count: 1, total_pages: 1, per_page: 5 } })

		const result = await adapter.list({ page: 2, perPage: 5 })

		const [url, init] = lastCall()
		expect(url).toBe('https://api.example.com/sparks?page=2')
		expect((init.headers as Record<string, string>)['X-Per-Page']).toBe('5')
		expect(result).toMatchObject({ page: 2, total: 1, totalPages: 1, perPage: 5 })
		expect(result.results).toEqual([saved])
	})

	it('gets one spark', async () => {
		respond({ spark: apiSpark })

		expect(await adapter.get('spark-1')).toEqual(saved)
		expect(lastCall()[0]).toBe('https://api.example.com/sparks/spark-1')
	})

	it('creates a spark with a snake_case body', async () => {
		respond({ spark: apiSpark }, 201)

		const result = await adapter.create(spark, '2026-11-20')

		const [url, init] = lastCall()
		expect(url).toBe('https://api.example.com/sparks')
		expect(init.method).toBe('POST')
		expect(JSON.parse(init.body as string)).toEqual({
			spark: {
				spark_date: '2026-11-20',
				characters: ['1040000000', '1040000100'],
				moons: ['1040000200'],
				summons: ['2040000000'],
				sparked_marks: [{ column: 'characters', index: 1 }],
				draws: 600,
				pool: 'flash',
				season: 'halloween'
			}
		})
		expect(result).toEqual(saved)
	})

	it('updates a spark', async () => {
		respond({ spark: { ...apiSpark, sparked_marks: [] } })

		const result = await adapter.update('spark-1', { ...spark, sparked: [] }, '2026-11-20')

		const [url, init] = lastCall()
		expect(url).toBe('https://api.example.com/sparks/spark-1')
		expect(init.method).toBe('PATCH')
		expect(JSON.parse(init.body as string).spark.sparked_marks).toEqual([])
		expect(result.sparkedMarks).toEqual([])
	})

	it('deletes a spark', async () => {
		respond(undefined, 204)

		await adapter.destroy('spark-1')

		const [url, init] = lastCall()
		expect(url).toBe('https://api.example.com/sparks/spark-1')
		expect(init.method).toBe('DELETE')
	})
})
