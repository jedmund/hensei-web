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
}

/**
 * Default entity adapter instance
 */
export const entityAdapter = new EntityAdapter(DEFAULT_ADAPTER_CONFIG)
