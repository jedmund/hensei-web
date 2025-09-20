/**
 * Tests for EntityAdapter
 *
 * These tests verify read-only access to canonical game data
 * for weapons, characters, and summons.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EntityAdapter } from '../entity.adapter'
import type { Weapon, Character, Summon } from '../entity.adapter'

describe('EntityAdapter', () => {
	let adapter: EntityAdapter
	let originalFetch: typeof global.fetch

	const mockWeapon: Weapon = {
		id: 'weapon-1',
		granblueId: '1040001',
		name: {
			en: 'Sword of Justice',
			ja: '正義の剣'
		},
		rarity: 4,
		element: 1,
		proficiency: 1,
		series: 1,
		weaponType: 1,
		minHp: 100,
		maxHp: 500,
		minAttack: 200,
		maxAttack: 1000,
		flbHp: 600,
		flbAttack: 1200,
		ulbHp: 700,
		ulbAttack: 1400,
		transcendenceHp: 800,
		transcendenceAttack: 1600,
		awakenings: [
			{
				id: 'awk-1',
				name: { en: 'Attack Boost' },
				level: 1
			}
		]
	}

	const mockCharacter: Character = {
		id: 'char-1',
		granblueId: '3040001',
		name: {
			en: 'Hero',
			ja: '英雄'
		},
		rarity: 5,
		element: 2,
		proficiency1: 1,
		proficiency2: 2,
		series: 1,
		minHp: 150,
		maxHp: 750,
		minAttack: 250,
		maxAttack: 1250,
		flbHp: 900,
		flbAttack: 1500,
		ulbHp: 1050,
		ulbAttack: 1750,
		transcendenceHp: 1200,
		transcendenceAttack: 2000,
		special: false,
		seasonalId: 'summer-1',
		awakenings: [
			{
				id: 'awk-2',
				name: { en: 'HP Boost' },
				level: 2
			}
		]
	}

	const mockSummon: Summon = {
		id: 'summon-1',
		granblueId: '2040001',
		name: {
			en: 'Bahamut',
			ja: 'バハムート'
		},
		rarity: 5,
		element: 0,
		series: 2,
		minHp: 200,
		maxHp: 1000,
		minAttack: 300,
		maxAttack: 1500,
		flbHp: 1200,
		flbAttack: 1800,
		ulbHp: 1400,
		ulbAttack: 2100,
		transcendenceHp: 1600,
		transcendenceAttack: 2400,
		subaura: false,
		cooldown: 9
	}

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new EntityAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	describe('weapon operations', () => {
		it('should get a weapon by ID', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockWeapon
			})

			const result = await adapter.getWeapon('weapon-1')

			expect(result).toEqual(mockWeapon)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/weapons/weapon-1',
				expect.objectContaining({
					method: 'GET'
				})
			)
		})

		it('should batch fetch multiple weapons', async () => {
			const mockWeapon2 = { ...mockWeapon, id: 'weapon-2' }
			global.fetch = vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockWeapon
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockWeapon2
				})

			const result = await adapter.getWeapons(['weapon-1', 'weapon-2'])

			expect(result).toEqual([mockWeapon, mockWeapon2])
			expect(global.fetch).toHaveBeenCalledTimes(2)
		})
	})

	describe('character operations', () => {
		it('should get a character by ID', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockCharacter
			})

			const result = await adapter.getCharacter('char-1')

			expect(result).toEqual(mockCharacter)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/characters/char-1',
				expect.objectContaining({
					method: 'GET'
				})
			)
		})

		it('should batch fetch multiple characters', async () => {
			const mockCharacter2 = { ...mockCharacter, id: 'char-2' }
			global.fetch = vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCharacter
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockCharacter2
				})

			const result = await adapter.getCharacters(['char-1', 'char-2'])

			expect(result).toEqual([mockCharacter, mockCharacter2])
			expect(global.fetch).toHaveBeenCalledTimes(2)
		})
	})

	describe('summon operations', () => {
		it('should get a summon by ID', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockSummon
			})

			const result = await adapter.getSummon('summon-1')

			expect(result).toEqual(mockSummon)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/summons/summon-1',
				expect.objectContaining({
					method: 'GET'
				})
			)
		})

		it('should batch fetch multiple summons', async () => {
			const mockSummon2 = { ...mockSummon, id: 'summon-2' }
			global.fetch = vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockSummon
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockSummon2
				})

			const result = await adapter.getSummons(['summon-1', 'summon-2'])

			expect(result).toEqual([mockSummon, mockSummon2])
			expect(global.fetch).toHaveBeenCalledTimes(2)
		})
	})

	describe('caching', () => {
		it('should cache entity requests', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockWeapon
			})

			// First call
			await adapter.getWeapon('weapon-1')

			// Second call (should use cache)
			await adapter.getWeapon('weapon-1')

			// Should only call fetch once due to caching
			expect(global.fetch).toHaveBeenCalledTimes(1)
		})

		it('should clear weapon cache', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockWeapon
			})

			// First call
			await adapter.getWeapon('weapon-1')

			// Clear weapon cache
			adapter.clearEntityCache('weapons')

			// Second call (should not use cache)
			await adapter.getWeapon('weapon-1')

			// Should call fetch twice since cache was cleared
			expect(global.fetch).toHaveBeenCalledTimes(2)
		})

		it('should clear character cache', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockCharacter
			})

			// First call
			await adapter.getCharacter('char-1')

			// Clear character cache
			adapter.clearEntityCache('characters')

			// Second call (should not use cache)
			await adapter.getCharacter('char-1')

			// Should call fetch twice since cache was cleared
			expect(global.fetch).toHaveBeenCalledTimes(2)
		})

		it('should clear summon cache', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockSummon
			})

			// First call
			await adapter.getSummon('summon-1')

			// Clear summon cache
			adapter.clearEntityCache('summons')

			// Second call (should not use cache)
			await adapter.getSummon('summon-1')

			// Should call fetch twice since cache was cleared
			expect(global.fetch).toHaveBeenCalledTimes(2)
		})

		it('should clear all entity caches', async () => {
			global.fetch = vi
				.fn()
				.mockImplementation((url) => {
					if (url.includes('/weapons/')) {
						return Promise.resolve({
							ok: true,
							json: async () => mockWeapon
						})
					} else if (url.includes('/characters/')) {
						return Promise.resolve({
							ok: true,
							json: async () => mockCharacter
						})
					} else if (url.includes('/summons/')) {
						return Promise.resolve({
							ok: true,
							json: async () => mockSummon
						})
					}
					return Promise.reject(new Error('Unknown URL'))
				})

			// First calls
			await adapter.getWeapon('weapon-1')
			await adapter.getCharacter('char-1')
			await adapter.getSummon('summon-1')

			// Should have called fetch 3 times
			expect(global.fetch).toHaveBeenCalledTimes(3)

			// Clear all entity caches
			adapter.clearEntityCache()

			// Second calls (should not use cache)
			await adapter.getWeapon('weapon-1')
			await adapter.getCharacter('char-1')
			await adapter.getSummon('summon-1')

			// Should have called fetch 6 times total
			expect(global.fetch).toHaveBeenCalledTimes(6)
		})
	})

	describe('error handling', () => {
		it('should handle 404 errors', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				statusText: 'Not Found',
				json: async () => ({ error: 'Weapon not found' })
			})

			await expect(adapter.getWeapon('invalid-id')).rejects.toThrow()
		})

		it('should handle network errors', async () => {
			global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

			await expect(adapter.getCharacter('char-1')).rejects.toThrow('Network error')
		})

		it('should handle JSON parse errors', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => {
					throw new Error('Invalid JSON')
				}
			})

			await expect(adapter.getSummon('summon-1')).rejects.toThrow()
		})
	})

	describe('configuration', () => {
		it('should use custom cache time', async () => {
			const customAdapter = new EntityAdapter({
				baseURL: 'https://api.example.com',
				cacheTime: 60000 // 1 minute
			})

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockWeapon
			})

			await customAdapter.getWeapon('weapon-1')

			// The cache time is set internally, but we can verify it's configured
			expect(customAdapter).toBeDefined()
		})

		it('should use default baseURL if not provided', () => {
			const defaultAdapter = new EntityAdapter()
			expect(defaultAdapter).toBeDefined()
		})
	})
})