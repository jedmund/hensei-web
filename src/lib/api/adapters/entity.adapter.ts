/**
 * Entity Adapter
 *
 * Handles read-only access to canonical game data (weapons, characters, summons).
 * This data represents the official game information that users reference
 * but cannot modify.
 *
 * @module adapters/entity
 */

import { BaseAdapter } from './base.adapter'
import type { AdapterOptions } from './types'
import { DEFAULT_ADAPTER_CONFIG } from './config'

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
	series?: number
	weaponType?: number
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
	}
	maxLevel?: number
	skillLevelCap?: number
	weapon_skills?: Array<{
		name?: string
		description?: string
	}>
	awakenings?: Array<{
		id: string
		name: Record<string, string>
		level: number
	}>
}

/**
 * Canonical character data from the game
 */
export interface Character {
	id: string
	granblueId: string
	characterId?: number
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
	series?: number
	race?: number[]
	hp?: {
		minHp?: number
		maxHp?: number
		maxHpFlb?: number
	}
	atk?: {
		minAtk?: number
		maxAtk?: number
		maxAtkFlb?: number
	}
	uncap?: {
		flb?: boolean
		ulb?: boolean
		transcendence?: boolean
	}
	special?: boolean
	seasonalId?: string
	awakenings?: Array<{
		id: string
		name: Record<string, string>
		level: number
	}>
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
	series?: number
	slot?: number
	group?: number
}

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
	series?: number
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
	cooldown?: number
	callName?: string
	callDescription?: string
	auraName?: string
	auraDescription?: string
	subAuraName?: string
	subAuraDescription?: string
}

/**
 * Response from character granblue_id validation
 */
export interface CharacterValidationResult {
	valid: boolean
	granblueId: string
	existsInDb: boolean
	error?: string
	imageUrls?: {
		main?: string
		grid?: string
		square?: string
	}
}

/**
 * Payload for creating a new character
 */
export interface CreateCharacterPayload {
	granblue_id: string
	name_en: string
	name_jp?: string
	character_id?: number[]  // Array for dual/trio units
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
	min_atk?: number
	max_atk?: number
	max_atk_flb?: number
	max_atk_ulb?: number
	base_da?: number
	base_ta?: number
	ougi_ratio?: number
	ougi_ratio_flb?: number
	flb?: boolean
	ulb?: boolean
	special?: boolean
	release_date?: string | null
	flb_date?: string | null
	ulb_date?: string | null
	wiki_en?: string
	wiki_ja?: string
	gamewith?: string
	kamigame?: string
	nicknames_en?: string[]
	nicknames_jp?: string[]
	wiki_raw?: string | null
}

/**
 * Response from character image download status
 */
export interface CharacterDownloadStatus {
	status: 'queued' | 'processing' | 'completed' | 'failed' | 'not_found'
	progress?: number
	imagesDownloaded?: number
	imagesTotal?: number
	error?: string
	characterId?: string
	granblueId?: string
	images?: Record<string, string[]>
	updatedAt?: string
}

/**
 * Response from summon granblue_id validation
 */
export interface SummonValidationResult {
	valid: boolean
	granblueId: string
	existsInDb: boolean
	error?: string
	imageUrls?: {
		main?: string
		grid?: string
		square?: string
	}
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
	max_hp_xlb?: number  // transcendence HP
	min_atk?: number
	max_atk?: number
	max_atk_flb?: number
	max_atk_ulb?: number
	max_atk_xlb?: number  // transcendence ATK
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
	gamewith?: string
	kamigame?: string
	nicknames_en?: string[]
	nicknames_jp?: string[]
}

/**
 * Response from summon image download status
 */
export interface SummonDownloadStatus {
	status: 'queued' | 'processing' | 'completed' | 'failed' | 'not_found'
	progress?: number
	imagesDownloaded?: number
	imagesTotal?: number
	error?: string
	summonId?: string
	granblueId?: string
	images?: Record<string, string[]>
	updatedAt?: string
}

/**
 * Response from weapon granblue_id validation
 */
export interface WeaponValidationResult {
	valid: boolean
	granblueId: string
	existsInDb: boolean
	error?: string
	imageUrls?: {
		main?: string
		grid?: string
		square?: string
	}
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
	series?: number
	new_series?: number
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
	max_awakening_level?: number
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
	gamewith?: string
	kamigame?: string
	recruits?: string | null  // Character ID reference
	nicknames_en?: string[]
	nicknames_jp?: string[]
}

/**
 * Response from weapon image download status
 */
export interface WeaponDownloadStatus {
	status: 'queued' | 'processing' | 'completed' | 'failed' | 'not_found'
	progress?: number
	imagesDownloaded?: number
	imagesTotal?: number
	error?: string
	weaponId?: string
	granblueId?: string
	images?: Record<string, string[]>
	updatedAt?: string
}

/**
 * Raw data response from /raw endpoint
 */
export interface EntityRawData {
	wikiRaw: string | null
	gameRawEn: Record<string, unknown> | null
	gameRawJp: Record<string, unknown> | null
}

/**
 * Suggestions for character fields parsed from wiki data
 */
export interface CharacterSuggestions {
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
	releaseDate?: string
	flbDate?: string
	ulbDate?: string
	gamewith?: string
	kamigame?: string
}

/**
 * Suggestions for weapon fields parsed from wiki data
 */
export interface WeaponSuggestions {
	nameEn?: string
	nameJp?: string
	granblueId?: string
	rarity?: number
	element?: number
	proficiency?: number
	minHp?: number
	maxHp?: number
	maxHpFlb?: number
	minAtk?: number
	maxAtk?: number
	maxAtkFlb?: number
	flb?: boolean
	ulb?: boolean
	releaseDate?: string
	flbDate?: string
	ulbDate?: string
	gamewith?: string
	kamigame?: string
	recruits?: string
}

/**
 * Suggestions for summon fields parsed from wiki data
 */
export interface SummonSuggestions {
	nameEn?: string
	nameJp?: string
	granblueId?: string
	rarity?: number
	element?: number
	minHp?: number
	maxHp?: number
	maxHpFlb?: number
	minAtk?: number
	maxAtk?: number
	maxAtkFlb?: number
	flb?: boolean
	ulb?: boolean
	subaura?: boolean
	releaseDate?: string
	flbDate?: string
	ulbDate?: string
	gamewith?: string
	kamigame?: string
}

/**
 * Result from batch_preview for a single wiki page
 */
export interface BatchPreviewResult<T> {
	wikiPage: string
	status: 'success' | 'error'
	granblueId?: string
	wikiRaw?: string
	suggestions?: T
	imageStatus?: 'pending' | 'exists' | 'error' | 'no_id'
	error?: string
	redirectedFrom?: string
}

/**
 * Response from batch_preview endpoint
 */
export interface BatchPreviewResponse<T> {
	results: BatchPreviewResult<T>[]
}

/**
 * Entity adapter for accessing canonical game data
 */
export class EntityAdapter extends BaseAdapter {

	/**
	 * Gets canonical weapon data by ID
	 */
	async getWeapon(id: string): Promise<Weapon> {
		return this.request<Weapon>(`/weapons/${id}`, {
			method: 'GET',
			cacheTTL: 600000 // Cache for 10 minutes
		})
	}

	/**
	 * Gets canonical character data by ID
	 */
	async getCharacter(id: string): Promise<Character> {
		return this.request<Character>(`/characters/${id}`, {
			method: 'GET',
			cacheTTL: 600000 // Cache for 10 minutes
		})
	}

	/**
	 * Gets related characters (same character_id) for a given character
	 */
	async getRelatedCharacters(id: string): Promise<Character[]> {
		return this.request<Character[]>(`/characters/${id}/related`, {
			method: 'GET',
			cacheTTL: 600000 // Cache for 10 minutes
		})
	}

	/**
	 * Gets canonical summon data by ID
	 */
	async getSummon(id: string): Promise<Summon> {
		return this.request<Summon>(`/summons/${id}`, {
			method: 'GET',
			cacheTTL: 600000 // Cache for 10 minutes
		})
	}

	/**
	 * Batch fetch multiple weapons
	 */
	async getWeapons(ids: string[]): Promise<Weapon[]> {
		// Fetch in parallel with individual caching
		const promises = ids.map(id => this.getWeapon(id))
		return Promise.all(promises)
	}

	/**
	 * Batch fetch multiple characters
	 */
	async getCharacters(ids: string[]): Promise<Character[]> {
		const promises = ids.map(id => this.getCharacter(id))
		return Promise.all(promises)
	}

	/**
	 * Batch fetch multiple summons
	 */
	async getSummons(ids: string[]): Promise<Summon[]> {
		const promises = ids.map(id => this.getSummon(id))
		return Promise.all(promises)
	}

	/**
	 * Gets weapon keys with optional filtering
	 */
	async getWeaponKeys(params?: WeaponKeyQueryParams): Promise<WeaponKey[]> {
		const searchParams = new URLSearchParams()
		if (params?.series !== undefined) searchParams.set('series', String(params.series))
		if (params?.slot !== undefined) searchParams.set('slot', String(params.slot))
		if (params?.group !== undefined) searchParams.set('group', String(params.group))

		const queryString = searchParams.toString()
		const url = queryString ? `/weapon_keys?${queryString}` : '/weapon_keys'

		return this.request<WeaponKey[]>(url, {
			method: 'GET',
			cacheTTL: 3600000 // Cache for 1 hour - weapon keys rarely change
		})
	}

	/**
	 * Clears entity cache
	 */
	clearEntityCache(type?: 'weapons' | 'characters' | 'summons' | 'weapon_keys') {
		if (type) {
			this.clearCache(`/${type}`)
		} else {
			// Clear all entity caches
			this.clearCache('/weapons')
			this.clearCache('/characters')
			this.clearCache('/summons')
			this.clearCache('/weapon_keys')
		}
	}

	// ============================================
	// Character Creation & Image Download Methods
	// ============================================

	/**
	 * Validates a character granblue_id by checking if images exist on GBF servers
	 * Requires editor role (>= 7)
	 */
	async validateCharacterGranblueId(granblueId: string): Promise<CharacterValidationResult> {
		const response = await this.request<{
			valid: boolean
			granblue_id: string
			exists_in_db: boolean
			error?: string
			image_urls?: {
				main?: string
				grid?: string
				square?: string
			}
		}>(`/characters/validate/${granblueId}`, {
			method: 'GET'
		})

		return {
			valid: response.valid,
			granblueId: response.granblue_id,
			existsInDb: response.exists_in_db,
			error: response.error,
			imageUrls: response.image_urls
		}
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
		// Invalidate cache for this character
		this.clearCache(`/characters/${id}`)
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
	 */
	async downloadCharacterImage(
		characterId: string,
		size: string,
		transformation?: string,
		force?: boolean
	): Promise<{ success: boolean; error?: string }> {
		return this.request(`/characters/${characterId}/download_image`, {
			method: 'POST',
			body: { size, transformation, force }
		})
	}

	/**
	 * Gets the status of an ongoing character image download
	 * Requires editor role (>= 7)
	 */
	async getCharacterDownloadStatus(characterId: string): Promise<CharacterDownloadStatus> {
		const response = await this.request<{
			status: string
			progress?: number
			images_downloaded?: number
			images_total?: number
			error?: string
			character_id?: string
			granblue_id?: string
			images?: Record<string, string[]>
			updated_at?: string
		}>(`/characters/${characterId}/download_status`, {
			method: 'GET'
		})

		return {
			status: response.status as CharacterDownloadStatus['status'],
			progress: response.progress,
			imagesDownloaded: response.images_downloaded,
			imagesTotal: response.images_total,
			error: response.error,
			characterId: response.character_id,
			granblueId: response.granblue_id,
			images: response.images,
			updatedAt: response.updated_at
		}
	}

	// ============================================
	// Summon Creation & Image Download Methods
	// ============================================

	/**
	 * Validates a summon granblue_id by checking if images exist on GBF servers
	 * Requires editor role (>= 7)
	 */
	async validateSummonGranblueId(granblueId: string): Promise<SummonValidationResult> {
		const response = await this.request<{
			valid: boolean
			granblue_id: string
			exists_in_db: boolean
			error?: string
			image_urls?: {
				main?: string
				grid?: string
				square?: string
			}
		}>(`/summons/validate/${granblueId}`, {
			method: 'GET'
		})

		return {
			valid: response.valid,
			granblueId: response.granblue_id,
			existsInDb: response.exists_in_db,
			error: response.error,
			imageUrls: response.image_urls
		}
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
		const response = await this.request<{
			status: string
			progress?: number
			images_downloaded?: number
			images_total?: number
			error?: string
			summon_id?: string
			granblue_id?: string
			images?: Record<string, string[]>
			updated_at?: string
		}>(`/summons/${summonId}/download_status`, {
			method: 'GET'
		})

		return {
			status: response.status as SummonDownloadStatus['status'],
			progress: response.progress,
			imagesDownloaded: response.images_downloaded,
			imagesTotal: response.images_total,
			error: response.error,
			summonId: response.summon_id,
			granblueId: response.granblue_id,
			images: response.images,
			updatedAt: response.updated_at
		}
	}

	// ============================================
	// Weapon Creation & Image Download Methods
	// ============================================

	/**
	 * Validates a weapon granblue_id by checking if images exist on GBF servers
	 * Requires editor role (>= 7)
	 */
	async validateWeaponGranblueId(granblueId: string): Promise<WeaponValidationResult> {
		const response = await this.request<{
			valid: boolean
			granblue_id: string
			exists_in_db: boolean
			error?: string
			image_urls?: {
				main?: string
				grid?: string
				square?: string
			}
		}>(`/weapons/validate/${granblueId}`, {
			method: 'GET'
		})

		return {
			valid: response.valid,
			granblueId: response.granblue_id,
			existsInDb: response.exists_in_db,
			error: response.error,
			imageUrls: response.image_urls
		}
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
		// Invalidate cache for this weapon
		this.clearCache(`/weapons/${id}`)
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
		const response = await this.request<{
			status: string
			progress?: number
			images_downloaded?: number
			images_total?: number
			error?: string
			weapon_id?: string
			granblue_id?: string
			images?: Record<string, string[]>
			updated_at?: string
		}>(`/weapons/${weaponId}/download_status`, {
			method: 'GET'
		})

		return {
			status: response.status as WeaponDownloadStatus['status'],
			progress: response.progress,
			imagesDownloaded: response.images_downloaded,
			imagesTotal: response.images_total,
			error: response.error,
			weaponId: response.weapon_id,
			granblueId: response.granblue_id,
			images: response.images,
			updatedAt: response.updated_at
		}
	}

	// ============================================
	// Raw Data Methods (for database viewing)
	// ============================================

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

	// ============================================
	// Wiki Fetch Methods (editor-only)
	// ============================================

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
	 * Fetches and stores wiki data for a weapon
	 * Requires editor role (>= 7)
	 */
	async fetchWeaponWiki(id: string): Promise<EntityRawData> {
		return this.request<EntityRawData>(`/weapons/${id}/fetch_wiki`, {
			method: 'POST'
		})
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

	// ============================================
	// Batch Preview Methods (for batch import)
	// ============================================

	/**
	 * Fetches wiki data and suggestions for multiple character wiki pages
	 * Requires editor role (>= 7)
	 * @param wikiPages - Array of wiki page names (max 10)
	 */
	async batchPreviewCharacters(
		wikiPages: string[]
	): Promise<BatchPreviewResponse<CharacterSuggestions>> {
		return this.request<BatchPreviewResponse<CharacterSuggestions>>('/characters/batch_preview', {
			method: 'POST',
			body: { wiki_pages: wikiPages }
		})
	}

	/**
	 * Fetches wiki data and suggestions for multiple weapon wiki pages
	 * Requires editor role (>= 7)
	 * @param wikiPages - Array of wiki page names (max 10)
	 */
	async batchPreviewWeapons(
		wikiPages: string[]
	): Promise<BatchPreviewResponse<WeaponSuggestions>> {
		return this.request<BatchPreviewResponse<WeaponSuggestions>>('/weapons/batch_preview', {
			method: 'POST',
			body: { wiki_pages: wikiPages }
		})
	}

	/**
	 * Fetches wiki data and suggestions for multiple summon wiki pages
	 * Requires editor role (>= 7)
	 * @param wikiPages - Array of wiki page names (max 10)
	 */
	async batchPreviewSummons(
		wikiPages: string[]
	): Promise<BatchPreviewResponse<SummonSuggestions>> {
		return this.request<BatchPreviewResponse<SummonSuggestions>>('/summons/batch_preview', {
			method: 'POST',
			body: { wiki_pages: wikiPages }
		})
	}
}

/**
 * Default entity adapter instance
 */
export const entityAdapter = new EntityAdapter(DEFAULT_ADAPTER_CONFIG)
