/**
 * Saved Spark Adapter
 *
 * The signed-in user's saved sparks: list (newest spark date first), get,
 * create, update and delete, plus conversion between a saved spark and the
 * spark maker's `Spark`.
 *
 * @module adapters/savedSpark
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { ApiPaginationMeta, PaginatedResponse, RequestOptions } from './types'
import { readSpark, writeSpark, type Spark } from '$lib/features/spark/spark'
import type { SavedSpark, SavedSparkPayload } from '$lib/types/api/savedSpark'

const BASE = '/sparks'
const DEFAULT_PER_PAGE = 15

const SPARK_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** A local date as YYYY-MM-DD. Not toISOString(), which gives the UTC day. */
export function formatSparkDate(date: Date): string {
	const pad = (value: number) => String(value).padStart(2, '0')
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Today in the viewer's time zone: the default spark date, and the latest one to offer */
export const todaySparkDate = (now: Date = new Date()) => formatSparkDate(now)

/** True for a real calendar day written as YYYY-MM-DD */
export function isSparkDate(value: string): boolean {
	const match = value.match(SPARK_DATE)
	if (!match) return false
	const [year, month, day] = match.slice(1).map(Number) as [number, number, number]
	const date = new Date(year, month - 1, day)
	return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

/** The request body for a spark and its date */
export function toSavedSparkPayload(spark: Spark, sparkDate: string): SavedSparkPayload {
	return {
		sparkDate,
		characters: [...spark.characters],
		moons: [...spark.moons],
		summons: [...spark.summons],
		sparked: spark.sparked ? { ...spark.sparked } : null,
		draws: spark.draws,
		pool: spark.pool,
		season: spark.season
	}
}

/**
 * A saved spark as the spark maker's `Spark` and its date. It goes through the
 * URL codec so it gets the same validation as a shared link: anything invalid
 * is dropped rather than breaking the page.
 */
export function fromSavedSpark(saved: SavedSpark): { spark: Spark; sparkDate: string } {
	return {
		spark: readSpark(new URLSearchParams(writeSpark({ ...saved, date: saved.sparkDate }))),
		sparkDate: saved.sparkDate
	}
}

export class SavedSparkAdapter extends BaseAdapter {
	/** The current user's sparks, newest spark date first */
	async list(
		params: { page?: number; perPage?: number } = {},
		options?: RequestOptions
	): Promise<PaginatedResponse<SavedSpark>> {
		const page = params.page ?? 1
		const response = await this.request<{ results: SavedSpark[]; meta?: ApiPaginationMeta }>(BASE, {
			...options,
			query: { page },
			headers: {
				...options?.headers,
				...(params.perPage ? { 'X-Per-Page': String(params.perPage) } : {})
			}
		})
		return this.toPaginatedResponse(
			response.results,
			response.meta,
			page,
			params.perPage ?? DEFAULT_PER_PAGE
		)
	}

	async get(id: string, options?: RequestOptions): Promise<SavedSpark> {
		const response = await this.request<{ spark: SavedSpark }>(`${BASE}/${id}`, options)
		return response.spark
	}

	async create(spark: Spark, sparkDate: string, options?: RequestOptions): Promise<SavedSpark> {
		const response = await this.request<{ spark: SavedSpark }>(BASE, {
			...options,
			method: 'POST',
			body: { spark: toSavedSparkPayload(spark, sparkDate) }
		})
		return response.spark
	}

	/** Replaces the saved spark's contents and date */
	async update(
		id: string,
		spark: Spark,
		sparkDate: string,
		options?: RequestOptions
	): Promise<SavedSpark> {
		const response = await this.request<{ spark: SavedSpark }>(`${BASE}/${id}`, {
			...options,
			method: 'PATCH',
			body: { spark: toSavedSparkPayload(spark, sparkDate) }
		})
		return response.spark
	}

	async destroy(id: string, options?: RequestOptions): Promise<void> {
		return this.request<void>(`${BASE}/${id}`, { ...options, method: 'DELETE' })
	}
}

export const savedSparkAdapter = new SavedSparkAdapter(DEFAULT_ADAPTER_CONFIG)
