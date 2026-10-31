/**
 * Summon Adapter
 *
 * Canonical summon data, plus the editor endpoints for creating,
 * importing and re-parsing summons.
 *
 * @module adapters/summon
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'
import {
	batchPreviewBody,
	toDownloadStatus,
	toValidationResult,
	type BatchPreviewResponse,
	type DownloadStatusResponse,
	type EntityDownloadStatus,
	type EntityRawData,
	type GranblueIdValidationResponse,
	type GranblueIdValidationResult
} from './entity.shared'
import type { SummonSeriesRef } from '$lib/types/api/summonSeries'
import type { SummonAura } from '$lib/types/api/entities'

/**
 * Canonical summon data from the game
 */
export interface Summon {
	id: string
	granblueId: string
	name: {
		en?: string
		ja?: string
	}
	rarity: number
	element: number
	/** Series - object with slug/name or null */
	series?: SummonSeriesRef | null
	/** Gacha promotions (1=Premium, 2=Classic, 3=ClassicII, 4=Flash, 5=Legend, etc.) */
	promotions?: number[]
	/** Human-readable promotion names */
	promotionNames?: string[]
	/** Structured per-tier auras parsed from the wiki (the calculator's source) */
	summonAuras?: SummonAura[]
	minHp?: number
	maxHp?: number
	minAttack?: number
	maxAttack?: number
	flbHp?: number
	flbAttack?: number
	ulbHp?: number
	ulbAttack?: number
	transcendenceHp?: number
	transcendenceAttack?: number
	hp?: {
		minHp?: number
		maxHp?: number
		maxHpFlb?: number
		maxHpUlb?: number
		maxHpXlb?: number
	}
	atk?: {
		minAtk?: number
		maxAtk?: number
		maxAtkFlb?: number
		maxAtkUlb?: number
		maxAtkXlb?: number
	}
	uncap?: {
		flb?: boolean
		ulb?: boolean
		transcendence?: boolean
	}
	subaura?: boolean
	limit?: boolean
	cooldown?: number
	callName?: string
	callDescription?: string
	auraName?: string
	auraDescription?: string
	subAuraName?: string
	subAuraDescription?: string
	nicknames?: {
		en?: string[]
		ja?: string[]
	}
	// Date fields
	releaseDate?: string
	flbDate?: string
	ulbDate?: string
	transcendenceDate?: string
	wiki?: { en?: string; ja?: string }
	gamewith?: string
	kamigame?: string
}

/**
 * Payload for creating a new summon
 * Note: Frontend uses "transcendence" but API expects "xlb" for stats
 */
export interface CreateSummonPayload {
	granblue_id: string
	name_en: string
	name_jp?: string
	summon_id?: string
	rarity?: number
	element?: number
	series?: string
	min_hp?: number
	max_hp?: number
	max_hp_flb?: number
	max_hp_ulb?: number
	max_hp_xlb?: number // transcendence HP
	min_atk?: number
	max_atk?: number
	max_atk_flb?: number
	max_atk_ulb?: number
	max_atk_xlb?: number // transcendence ATK
	max_level?: number
	flb?: boolean
	ulb?: boolean
	transcendence?: boolean
	subaura?: boolean
	limit?: boolean
	release_date?: string | null
	flb_date?: string | null
	ulb_date?: string | null
	transcendence_date?: string | null
	wiki_en?: string
	wiki_ja?: string
	wiki_raw?: string
	gamewith?: string
	kamigame?: string
	nicknames_en?: string[]
	nicknames_jp?: string[]
}

/**
 * Parsed summon data from wiki text
 */
export interface ParsedSummonData {
	nameEn?: string
	nameJp?: string
	granblueId?: string
	summonId?: string
	rarity?: number
	element?: number
	minHp?: number
	maxHp?: number
	maxHpFlb?: number
	maxHpUlb?: number
	minAtk?: number
	maxAtk?: number
	maxAtkFlb?: number
	maxAtkUlb?: number
	maxLevel?: number
	flb?: boolean
	ulb?: boolean
	transcendence?: boolean
	/** Series name (e.g., "Optimus", "Arcarum") */
	series?: string
	subaura?: boolean
	releaseDate?: string
	flbDate?: string
	ulbDate?: string
	gamewith?: string
	kamigame?: string
}

/**
 * Response from summon granblue_id validation
 */
export type SummonValidationResult = GranblueIdValidationResult

/**
 * Response from summon image download status
 */
export interface SummonDownloadStatus extends EntityDownloadStatus {
	summonId?: string
}

/**
 * Adapter for canonical summon data
 */
export class SummonAdapter extends BaseAdapter {
	/**
	 * Gets canonical summon data by ID
	 */
	async getSummon(id: string, options?: RequestOptions): Promise<Summon> {
		return this.request<Summon>(`/summons/${id}`, options)
	}

	/**
	 * Batch fetch multiple summons
	 */
	async getSummons(ids: string[]): Promise<Summon[]> {
		const promises = ids.map((id) => this.getSummon(id))
		return Promise.all(promises)
	}

	/**
	 * Validates a summon granblue_id by checking if images exist on GBF servers
	 * Requires editor role (>= 7)
	 */
	async validateSummonGranblueId(granblueId: string): Promise<SummonValidationResult> {
		const response = await this.request<GranblueIdValidationResponse>(
			`/summons/validate/${granblueId}`,
			{
				method: 'GET'
			}
		)

		return toValidationResult(response)
	}

	/**
	 * Creates a new summon record
	 * Requires editor role (>= 7)
	 */
	async createSummon(payload: CreateSummonPayload): Promise<Summon> {
		return this.request<Summon>('/summons', {
			method: 'POST',
			body: { summon: payload }
		})
	}

	/**
	 * Updates an existing summon record
	 * Requires editor role (>= 7)
	 */
	async updateSummon(id: string, payload: Partial<CreateSummonPayload>): Promise<Summon> {
		const result = await this.request<Summon>(`/summons/${id}`, {
			method: 'PATCH',
			body: { summon: payload }
		})
		// Invalidate cache for this summon
		this.clearCache(`/summons/${id}`)
		return result
	}

	/**
	 * Triggers async image download for a summon
	 * Requires editor role (>= 7)
	 */
	async downloadSummonImages(
		summonId: string,
		options?: { force?: boolean; size?: 'all' | string }
	): Promise<{ status: string; summonId: string; message: string }> {
		return this.request(`/summons/${summonId}/download_images`, {
			method: 'POST',
			body: { options }
		})
	}

	/**
	 * Downloads a single image for a summon (synchronous)
	 * Requires editor role (>= 7)
	 * @param summonId - Summon database ID
	 * @param size - Image size variant (main, grid, wide, square, detail)
	 * @param transformation - Pose variant (empty=Base, 02=ULB, 03=Trans1, 04=Trans5)
	 * @param force - Force re-download even if image exists
	 */
	async downloadSummonImage(
		summonId: string,
		size: string,
		transformation?: string,
		force?: boolean
	): Promise<{ success: boolean; error?: string }> {
		return this.request(`/summons/${summonId}/download_image`, {
			method: 'POST',
			body: { size, transformation, force }
		})
	}

	/**
	 * Gets the status of an ongoing summon image download
	 * Requires editor role (>= 7)
	 */
	async getSummonDownloadStatus(summonId: string): Promise<SummonDownloadStatus> {
		const response = await this.request<DownloadStatusResponse & { summon_id?: string }>(
			`/summons/${summonId}/download_status`,
			{ method: 'GET' }
		)

		return { ...toDownloadStatus(response), summonId: response.summon_id }
	}

	/**
	 * Gets raw wiki and game data for a summon
	 * This data is fetched separately to avoid bloating regular entity responses
	 * Note: BaseAdapter.request() automatically transforms snake_case to camelCase
	 */
	async getSummonRawData(id: string): Promise<EntityRawData> {
		// Response keys are already camelCase after BaseAdapter.transformResponse()
		const response = await this.request<EntityRawData>(`/summons/${id}/raw`, {
			method: 'GET'
		})

		return response
	}

	/**
	 * Fetches and stores wiki data for a summon
	 * Requires editor role (>= 7)
	 */
	async fetchSummonWiki(id: string): Promise<EntityRawData> {
		return this.request<EntityRawData>(`/summons/${id}/fetch_wiki`, {
			method: 'POST'
		})
	}

	async reparseSummon(id: string, refetch = false): Promise<Summon> {
		return this.request<Summon>(`/summons/${id}/reparse${refetch ? '?refetch=true' : ''}`, {
			method: 'POST'
		})
	}

	/**
	 * Fetches wiki data and parses it for multiple summon wiki pages
	 * Requires editor role (>= 7)
	 * @param wikiPages - Array of wiki page names (max 10)
	 * @param wikiData - Optional pre-fetched wiki text keyed by page name
	 */
	async batchPreviewSummons(
		wikiPages: string[],
		wikiData?: Record<string, string>
	): Promise<BatchPreviewResponse<ParsedSummonData>> {
		return this.request<BatchPreviewResponse<ParsedSummonData>>('/summons/batch_preview', {
			method: 'POST',
			body: batchPreviewBody(wikiPages, wikiData)
		})
	}
}

export const summonAdapter = new SummonAdapter(DEFAULT_ADAPTER_CONFIG)
