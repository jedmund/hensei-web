/**
 * Weapon Adapter
 *
 * Canonical weapon data: weapons, weapon keys, AX skills and befoulments,
 * plus the editor endpoints for creating, importing and re-parsing weapons.
 *
 * @module adapters/weapon
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'
import {
	batchPreviewBody,
	type BatchPreviewResponse,
	type EntityDownloadStatus,
	type EntityRawData,
	type GranblueIdValidationResult
} from './entity.shared'
import type { WeaponSeriesRef } from '$lib/types/api/weaponSeries'
import type { CharacterSeriesRef } from '$lib/types/api/characterSeries'
import type { WeaponStatModifier } from '$lib/types/api/weaponStatModifier'
import type { SummonAura, WeaponSkill } from '$lib/types/api/entities'

/**
 * Canonical weapon data from the game
 */
export interface Weapon {
	id: string
	granblueId: string
	name: {
		en?: string
		ja?: string
	}
	rarity: number
	element: number
	proficiency: number
	/** Weapon series - object with slug/name/flags */
	series?: WeaponSeriesRef | null
	weaponType?: number
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
	}
	atk?: {
		minAtk?: number
		maxAtk?: number
		maxAtkFlb?: number
		maxAtkUlb?: number
	}
	uncap?: {
		flb?: boolean
		ulb?: boolean
		transcendence?: boolean
		extraPrerequisite?: number | null
	}
	maxLevel?: number
	maxSkillLevel?: number
	maxAwakeningLevel?: number
	maxExorcismLevel?: number | null
	limit?: number
	extra?: boolean
	ax?: boolean
	axType?: number
	bulletSlots?: number[]
	skillLevelCap?: number
	weaponSkills?: WeaponSkill[]
	/** When the skills were last built from the wiki; null or missing: never */
	skillsBuiltAt?: string | null
	awakenings?: Array<{
		id: string
		name: Record<string, string>
		level: number
	}>
	nicknames?: {
		en?: string[]
		ja?: string[]
	}
	recruits?: {
		id: string
		granblueId: string
		name: {
			en?: string
			ja?: string
		}
		element?: number | null
		season?: number | null
		series?: (number | CharacterSeriesRef)[] | null
		styleSwap?: boolean
	}
	// Forge chain fields (from :grid and :full views)
	forgeOrder?: number | null
	forgedFrom?: { id: string; granblueId: string; name: { en?: string; ja?: string } } | null
	// Element variant IDs: maps element number (as string key) to variant game ID
	elementVariantIds?: Record<string, string> | null
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
 * Weapon key data for customizing weapons
 */
export interface WeaponKey {
	id: string
	granblue_id: number
	name: {
		en: string
		ja: string
	}
	slug: string
	series: number[]
	slot: number
	group: number
	order: number
}

/**
 * Query parameters for fetching weapon keys
 */
export interface WeaponKeyQueryParams {
	/** Filter by weapon series slug (e.g., 'dark-opus', 'ultima') */
	seriesSlug?: string
	slot?: number
	group?: number
}

/**
 * Payload for creating a new weapon
 * Note: Frontend uses "transcendence" but API expects "xlb" for stats
 */
export interface CreateWeaponPayload {
	granblue_id: string
	name_en: string
	name_jp?: string
	rarity?: number
	element?: number
	proficiency?: number
	/** Weapon series ID (UUID) */
	weapon_series_id?: string
	min_hp?: number
	max_hp?: number
	max_hp_flb?: number
	max_hp_ulb?: number
	min_atk?: number
	max_atk?: number
	max_atk_flb?: number
	max_atk_ulb?: number
	max_level?: number
	max_skill_level?: number
	max_awakening_level?: number | null
	flb?: boolean
	ulb?: boolean
	transcendence?: boolean
	extra?: boolean
	limit?: boolean
	ax?: boolean
	release_date?: string | null
	flb_date?: string | null
	ulb_date?: string | null
	transcendence_date?: string | null
	wiki_en?: string
	wiki_ja?: string
	wiki_raw?: string
	gamewith?: string
	kamigame?: string
	recruits?: string | null // Character ID reference
	nicknames_en?: string[]
	nicknames_jp?: string[]
	awakening_ids?: string[]
}

/**
 * Parsed weapon data from wiki text
 */
export interface ParsedWeaponData {
	nameEn?: string
	nameJp?: string
	granblueId?: string
	rarity?: number
	element?: number
	proficiency?: number
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
	/** Series ID (UUID) - looked up from wiki series name */
	series?: string
	releaseDate?: string
	flbDate?: string
	ulbDate?: string
	gamewith?: string
	kamigame?: string
	recruits?: string
}

/**
 * Response from weapon granblue_id validation
 */
export type WeaponValidationResult = GranblueIdValidationResult

/**
 * Response from weapon image download status
 */
export interface WeaponDownloadStatus extends EntityDownloadStatus {
	weaponId?: string
}

/**
 * Adapter for canonical weapon data
 */
export class WeaponAdapter extends BaseAdapter {
	/**
	 * Gets canonical weapon data by ID
	 */
	async getWeapon(id: string, options?: RequestOptions): Promise<Weapon> {
		return this.request<Weapon>(`/weapons/${id}`, options)
	}

	/**
	 * Batch fetch multiple weapons
	 */
	async getWeapons(ids: string[]): Promise<Weapon[]> {
		// Fetch in parallel with individual caching
		const promises = ids.map((id) => this.getWeapon(id))
		return Promise.all(promises)
	}

	/**
	 * Gets weapon keys with optional filtering
	 */
	async getWeaponKeys(params?: WeaponKeyQueryParams): Promise<WeaponKey[]> {
		const searchParams = new URLSearchParams()
		if (params?.seriesSlug) {
			searchParams.set('series_slug', params.seriesSlug)
		}
		if (params?.slot !== undefined) searchParams.set('slot', String(params.slot))
		if (params?.group !== undefined) searchParams.set('group', String(params.group))

		const queryString = searchParams.toString()
		const url = queryString ? `/weapon_keys?${queryString}` : '/weapon_keys'

		return this.request<WeaponKey[]>(url)
	}

	async updateWeaponKey(
		id: string,
		payload: { name_en?: string; name_jp?: string }
	): Promise<unknown> {
		return this.request(`/weapon_keys/${id}`, {
			method: 'PATCH',
			body: { weapon_key: payload }
		})
	}

	/**
	 * Gets all weapon stat modifiers (AX skills and befoulments)
	 * @param category - Optional filter: 'ax' or 'befoulment'
	 */
	async getWeaponStatModifiers(category?: 'ax' | 'befoulment'): Promise<WeaponStatModifier[]> {
		const searchParams = new URLSearchParams()
		if (category) {
			searchParams.set('category', category)
		}

		const queryString = searchParams.toString()
		const url = queryString ? `/weapon_stat_modifiers?${queryString}` : '/weapon_stat_modifiers'

		return this.request<WeaponStatModifier[]>(url)
	}

	/**
	 * Gets AX skills only
	 */
	async getAxSkills(): Promise<WeaponStatModifier[]> {
		return this.getWeaponStatModifiers('ax')
	}

	/**
	 * Gets befoulments only
	 */
	async getBefoulments(): Promise<WeaponStatModifier[]> {
		return this.getWeaponStatModifiers('befoulment')
	}

	/**
	 * Validates a weapon granblue_id by checking if images exist on GBF servers
	 * Requires editor role (>= 7)
	 */
	async validateWeaponGranblueId(granblueId: string): Promise<WeaponValidationResult> {
		return this.request<WeaponValidationResult>(`/weapons/validate/${granblueId}`, {
			method: 'GET'
		})
	}

	/**
	 * Creates a new weapon record
	 * Requires editor role (>= 7)
	 */
	async createWeapon(payload: CreateWeaponPayload): Promise<Weapon> {
		return this.request<Weapon>('/weapons', {
			method: 'POST',
			body: { weapon: payload }
		})
	}

	/**
	 * Updates an existing weapon record
	 * Requires editor role (>= 7)
	 */
	async updateWeapon(id: string, payload: Partial<CreateWeaponPayload>): Promise<Weapon> {
		const result = await this.request<Weapon>(`/weapons/${id}`, {
			method: 'PATCH',
			body: { weapon: payload }
		})
		this.clearCache(`/weapons/${id}`)
		if (result.granblueId) {
			this.clearCache(`/weapons/${result.granblueId}`)
		}
		return result
	}

	/**
	 * Triggers async image download for a weapon
	 * Requires editor role (>= 7)
	 */
	async downloadWeaponImages(
		weaponId: string,
		options?: { force?: boolean; size?: 'all' | string }
	): Promise<{ status: string; weaponId: string; message: string }> {
		return this.request(`/weapons/${weaponId}/download_images`, {
			method: 'POST',
			body: { options }
		})
	}

	/**
	 * Downloads a single image for a weapon (synchronous)
	 * Requires editor role (>= 7)
	 * @param weaponId - Weapon database ID
	 * @param size - Image size variant (main, grid, square, base)
	 * @param transformation - Pose variant (empty=Base, 02=Trans1, 03=Trans5)
	 * @param force - Force re-download even if image exists
	 */
	async downloadWeaponImage(
		weaponId: string,
		size: string,
		transformation?: string,
		force?: boolean
	): Promise<{ success: boolean; error?: string }> {
		return this.request(`/weapons/${weaponId}/download_image`, {
			method: 'POST',
			body: { size, transformation, force }
		})
	}

	/**
	 * Gets the status of an ongoing weapon image download
	 * Requires editor role (>= 7)
	 */
	async getWeaponDownloadStatus(weaponId: string): Promise<WeaponDownloadStatus> {
		return this.request<WeaponDownloadStatus>(`/weapons/${weaponId}/download_status`, {
			method: 'GET'
		})
	}

	/**
	 * Gets raw wiki and game data for a weapon
	 * This data is fetched separately to avoid bloating regular entity responses
	 * Note: BaseAdapter.request() automatically transforms snake_case to camelCase
	 */
	async getWeaponRawData(id: string): Promise<EntityRawData> {
		// Response keys are already camelCase after BaseAdapter.transformResponse()
		const response = await this.request<EntityRawData>(`/weapons/${id}/raw`, {
			method: 'GET'
		})

		return response
	}

	/**
	 * Fetches and stores wiki data for a weapon
	 * Requires editor role (>= 7)
	 */
	async fetchWeaponWiki(id: string): Promise<EntityRawData> {
		return this.request<EntityRawData>(`/weapons/${id}/fetch_wiki`, {
			method: 'POST'
		})
	}

	/**
	 * Re-parses an entity's stored wikitext into structured rows (weapon
	 * skills / summon auras). Characters go through characterRefresh.adapter. Pass refetch to pull fresh
	 * wikitext from the wiki first. Requires editor role (>= 7).
	 */
	async reparseWeapon(id: string, refetch = false): Promise<Weapon> {
		return this.request<Weapon>(`/weapons/${id}/reparse${refetch ? '?refetch=true' : ''}`, {
			method: 'POST'
		})
	}

	/**
	 * Fetches wiki data and parses it for multiple weapon wiki pages
	 * Requires editor role (>= 7)
	 * @param wikiPages - Array of wiki page names (max 10)
	 * @param wikiData - Optional pre-fetched wiki text keyed by page name
	 */
	async batchPreviewWeapons(
		wikiPages: string[],
		wikiData?: Record<string, string>
	): Promise<BatchPreviewResponse<ParsedWeaponData>> {
		return this.request<BatchPreviewResponse<ParsedWeaponData>>('/weapons/batch_preview', {
			method: 'POST',
			body: batchPreviewBody(wikiPages, wikiData)
		})
	}
}

export const weaponAdapter = new WeaponAdapter(DEFAULT_ADAPTER_CONFIG)
