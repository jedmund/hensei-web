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
	name: {
		en?: string
		ja?: string
	}
	rarity: number
	element: number
	proficiency1?: number
	proficiency2?: number
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
	special?: boolean
	seasonalId?: string
	awakenings?: Array<{
		id: string
		name: Record<string, string>
		level: number
	}>
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
	subaura?: boolean
	cooldown?: number
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
	 * Clears entity cache
	 */
	clearEntityCache(type?: 'weapons' | 'characters' | 'summons') {
		if (type) {
			this.clearCache(`/${type}`)
		} else {
			// Clear all entity caches
			this.clearCache('/weapons')
			this.clearCache('/characters')
			this.clearCache('/summons')
		}
	}
}

/**
 * Default entity adapter instance
 */
export const entityAdapter = new EntityAdapter(DEFAULT_ADAPTER_CONFIG)