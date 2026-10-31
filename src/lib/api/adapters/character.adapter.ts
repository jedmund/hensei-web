/**
 * Character Adapter
 *
 * Canonical character data, plus the editor endpoints for creating
 * and importing characters.
 *
 * @module adapters/character
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
import type { CharacterSeriesRef } from '$lib/types/api/characterSeries'
import type { CharacterSkill, CharacterSkillLink } from '$lib/types/api/entities'

/**
 * Canonical character data from the game
 */
export interface Character {
	id: string
	granblueId: string
	characterId?: number[]
	name: {
		en?: string
		ja?: string
	}
	rarity: number
	element: number
	gender?: number
	proficiency?: number[]
	proficiency1?: number
	proficiency2?: number
	race?: number[]
	/** Season integer (1=Standard, 2=Valentine, 3=Formal, 4=Summer, 5=Halloween, 6=Holiday) */
	season?: number | null
	/** Human-readable season name */
	seasonName?: string | null
	/** Series - array of objects with slug/name or legacy integers */
	series?: CharacterSeriesRef[] | number[]
	/** Human-readable series names */
	seriesNames?: string[]
	hp?: {
		minHp?: number
		maxHp?: number
		maxHpFlb?: number
		maxHpUlb?: number
		maxHpTranscendence?: number
	}
	atk?: {
		minAtk?: number
		maxAtk?: number
		maxAtkFlb?: number
		maxAtkUlb?: number
		maxAtkTranscendence?: number
	}
	// Other stats
	baseDa?: number
	baseTa?: number
	ougiRatio?: {
		ougiRatio?: number
		ougiRatioFlb?: number
	}
	uncap?: {
		flb?: boolean
		ulb?: boolean
		transcendence?: boolean
		maxTranscendenceStage?: number
	}
	special?: boolean
	awakenings?: Array<{
		id: string
		name: Record<string, string>
		level: number
	}>
	nicknames?: {
		en?: string[]
		ja?: string[]
	}
	/** Weapon that recruits this character (reverse of Weapon.recruits) */
	recruitedBy?: {
		id: string
		granblueId: string
		name: {
			en?: string
			ja?: string
		}
		promotions: number[]
		promotionNames: string[]
	}
	// Gender variant fields
	genderVariants?: boolean
	// Style swap fields (from :full view)
	styleSwap?: boolean
	styleName?: { en?: string; ja?: string } | null
	baseCharacter?: { id: string; granblueId: string; name: { en?: string; ja?: string } } | null
	styleSwaps?: Array<{
		id: string
		granblueId: string
		name: { en?: string; ja?: string }
		styleName: { en?: string; ja?: string } | null
	}>
	// Date fields
	releaseDate?: string
	flbDate?: string
	ulbDate?: string
	transcendenceDate?: string
	wiki?: { en?: string; ja?: string }
	gamewith?: string
	kamigame?: string
	// Parsed skill graph (from :full view)
	skills?: CharacterSkill[]
	skillLinks?: CharacterSkillLink[]
}

/**
 * Payload for creating a new character
 */
export interface CreateCharacterPayload {
	granblue_id: string
	name_en: string
	name_jp?: string
	character_id?: number[] // Array for dual/trio units
	rarity?: number
	element?: number
	race1?: number | null
	race2?: number | null
	gender?: number
	proficiency1?: number
	proficiency2?: number
	min_hp?: number
	max_hp?: number
	max_hp_flb?: number
	max_hp_ulb?: number
	max_hp_transcendence?: number
	min_atk?: number
	max_atk?: number
	max_atk_flb?: number
	max_atk_ulb?: number
	max_atk_transcendence?: number
	base_da?: number
	base_ta?: number
	ougi_ratio?: number
	ougi_ratio_flb?: number
	flb?: boolean
	ulb?: boolean
	transcendence?: boolean
	max_transcendence_stage?: number
	special?: boolean
	release_date?: string | null
	flb_date?: string | null
	ulb_date?: string | null
	transcendence_date?: string | null
	wiki_en?: string
	wiki_ja?: string
	gamewith?: string
	kamigame?: string
	nicknames_en?: string[]
	nicknames_jp?: string[]
	wiki_raw?: string | null
}

/**
 * Parsed character data from wiki text
 */
export interface ParsedCharacterData {
	nameEn?: string
	nameJp?: string
	granblueId?: string
	characterId?: number[]
	rarity?: number
	element?: number
	gender?: number
	proficiency1?: number
	proficiency2?: number
	race1?: number
	race2?: number
	minHp?: number
	maxHp?: number
	maxHpFlb?: number
	minAtk?: number
	maxAtk?: number
	maxAtkFlb?: number
	flb?: boolean
	ulb?: boolean
	transcendence?: boolean
	maxTranscendenceStage?: number
	special?: boolean
	/** Series array (e.g., [2] for Grand, [3] for Zodiac) */
	series?: number[]
	releaseDate?: string
	flbDate?: string
	ulbDate?: string
	transcendenceDate?: string
	gamewith?: string
	kamigame?: string
	/** Season enum value (1=Standard, 2=Valentine, etc.) */
	season?: number
	/** Whether character can be pulled from gacha */
	gachaAvailable?: boolean
	/** Promotion IDs where character appears */
	promotions?: number[]
}

/**
 * Response from character granblue_id validation
 */
export type CharacterValidationResult = GranblueIdValidationResult

/**
 * Response from character image download status
 */
export interface CharacterDownloadStatus extends EntityDownloadStatus {
	characterId?: string
}

/**
 * Adapter for canonical character data
 */
export class CharacterAdapter extends BaseAdapter {
	/**
	 * Gets canonical character data by ID
	 */
	async getCharacter(
		id: string,
		options?: { styleSwap?: boolean } & RequestOptions
	): Promise<Character> {
		const params = options?.styleSwap ? '?style_swap=true' : ''
		return this.request<Character>(`/characters/${id}${params}`, options)
	}

	/**
	 * Gets related characters (same character_id) for a given character
	 */
	async getRelatedCharacters(id: string): Promise<Character[]> {
		return this.request<Character[]>(`/characters/${id}/related`)
	}

	/**
	 * Batch fetch multiple characters
	 */
	async getCharacters(ids: string[]): Promise<Character[]> {
		const promises = ids.map((id) => this.getCharacter(id))
		return Promise.all(promises)
	}

	/**
	 * Validates a character granblue_id by checking if images exist on GBF servers
	 * Requires editor role (>= 7)
	 */
	async validateCharacterGranblueId(granblueId: string): Promise<CharacterValidationResult> {
		const response = await this.request<GranblueIdValidationResponse>(
			`/characters/validate/${granblueId}`,
			{
				method: 'GET'
			}
		)

		return toValidationResult(response)
	}

	/**
	 * Creates a new character record
	 * Requires editor role (>= 7)
	 */
	async createCharacter(payload: CreateCharacterPayload): Promise<Character> {
		return this.request<Character>('/characters', {
			method: 'POST',
			body: { character: payload }
		})
	}

	/**
	 * Updates an existing character record
	 * Requires editor role (>= 7)
	 */
	async updateCharacter(id: string, payload: Partial<CreateCharacterPayload>): Promise<Character> {
		const result = await this.request<Character>(`/characters/${id}`, {
			method: 'PATCH',
			body: { character: payload }
		})
		// Invalidate cache for this character (by UUID and granblueId)
		this.clearCache(`/characters/${id}`)
		if (result.granblueId) {
			this.clearCache(`/characters/${result.granblueId}`)
		}
		return result
	}

	/**
	 * Triggers async image download for a character
	 * Requires editor role (>= 7)
	 */
	async downloadCharacterImages(
		characterId: string,
		options?: { force?: boolean; size?: 'all' | string }
	): Promise<{ status: string; characterId: string; message: string }> {
		return this.request(`/characters/${characterId}/download_images`, {
			method: 'POST',
			body: { options }
		})
	}

	/**
	 * Downloads a single image for a character (synchronous)
	 * Requires editor role (>= 7)
	 * @param characterId - Character database ID
	 * @param size - Image size variant (main, grid, square, detail)
	 * @param transformation - Pose variant (01=Base, 02=MLB, 03=FLB, 04=Transcendence)
	 * @param force - Force re-download even if image exists
	 * @param element - Element variant for null-element characters (1-6)
	 * @param gender - Gender variant for null-element characters (0=Gran, 1=Djeeta)
	 */
	async downloadCharacterImage(
		characterId: string,
		size: string,
		transformation?: string,
		force?: boolean,
		element?: number,
		gender?: number
	): Promise<{ success: boolean; error?: string }> {
		return this.request(`/characters/${characterId}/download_image`, {
			method: 'POST',
			body: { size, transformation, force, element, gender }
		})
	}

	/**
	 * Gets the status of an ongoing character image download
	 * Requires editor role (>= 7)
	 */
	async getCharacterDownloadStatus(characterId: string): Promise<CharacterDownloadStatus> {
		const response = await this.request<DownloadStatusResponse & { character_id?: string }>(
			`/characters/${characterId}/download_status`,
			{ method: 'GET' }
		)

		return { ...toDownloadStatus(response), characterId: response.character_id }
	}

	/**
	 * Gets raw wiki and game data for a character
	 * This data is fetched separately to avoid bloating regular entity responses
	 * Note: BaseAdapter.request() automatically transforms snake_case to camelCase
	 */
	async getCharacterRawData(id: string): Promise<EntityRawData> {
		// Response keys are already camelCase after BaseAdapter.transformResponse()
		const response = await this.request<EntityRawData>(`/characters/${id}/raw`, {
			method: 'GET'
		})

		return response
	}

	/**
	 * Fetches and stores wiki data for a character
	 * Requires editor role (>= 7)
	 */
	async fetchCharacterWiki(id: string): Promise<EntityRawData> {
		return this.request<EntityRawData>(`/characters/${id}/fetch_wiki`, {
			method: 'POST'
		})
	}

	/**
	 * Fetches wiki data and parses it for multiple character wiki pages
	 * Requires editor role (>= 7)
	 * @param wikiPages - Array of wiki page names (max 10)
	 * @param wikiData - Optional pre-fetched wiki text keyed by page name
	 */
	async batchPreviewCharacters(
		wikiPages: string[],
		wikiData?: Record<string, string>
	): Promise<BatchPreviewResponse<ParsedCharacterData>> {
		return this.request<BatchPreviewResponse<ParsedCharacterData>>('/characters/batch_preview', {
			method: 'POST',
			body: batchPreviewBody(wikiPages, wikiData)
		})
	}
}

export const characterAdapter = new CharacterAdapter(DEFAULT_ADAPTER_CONFIG)
