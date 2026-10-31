/**
 * Tests for EntityAdapter
 *
 * EntityAdapter is a facade over the per-entity adapters. These tests
 * cover the facade itself: forwarding, caching and error handling.
 * Per-entity behaviour is tested in each adapter's own test file.
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
		series: {
			id: 'series-1',
			slug: 'dark-opus',
			name: { en: 'Dark Opus', ja: 'ダークオーパス' },
			hasWeaponKeys: true,
			hasAwakening: true,
			augmentType: 'no_augment',
			extra: false,
			elementChangeable: false,
			numWeaponKeys: 3
		},
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
		uncap: {
			flb: true,
			transcendence: true
		},
		special: false,
		gender: 0,
		race: [1, 2],
		proficiency: [1, 2],
		hp: {
			minHp: 150,
			maxHp: 750,
			maxHpFlb: 900
		},
		atk: {
			minAtk: 250,
			maxAtk: 1250,
			maxAtkFlb: 1500
		}
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
		series: {
			id: 'series-1',
			slug: 'optimus',
			name: { en: 'Optimus Series', ja: 'オプティマスシリーズ' }
		},
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

	describe('caching', () => {
		it('should not cache at adapter level (TanStack Query handles caching)', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockWeapon
			})

			await adapter.getWeapon('weapon-1')
			await adapter.getWeapon('weapon-1')

			// Both calls hit fetch since adapter-level caching was removed
			expect(global.fetch).toHaveBeenCalledTimes(2)
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
			global.fetch = vi.fn().mockImplementation((url) => {
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

	describe('forwarding', () => {
		it.each([
			['getWeapon', () => adapter.getWeapon('weapon-1'), '/weapons/weapon-1'],
			['getCharacter', () => adapter.getCharacter('char-1'), '/characters/char-1'],
			['getSummon', () => adapter.getSummon('summon-1'), '/summons/summon-1'],
			['getWeaponSkillFamilies', () => adapter.getWeaponSkillFamilies(), '/weapon_skill_families'],
			['getWeaponSeriesList', () => adapter.getWeaponSeriesList(), '/weapon_series'],
			['getBulletById', () => adapter.getBulletById('bullet-1'), '/bullets/bullet-1'],
			['getAwakenings', () => adapter.getAwakenings(), '/awakenings']
		])('%s requests the owning endpoint', async (_name, call, path) => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({})
			})

			await call()

			expect(global.fetch).toHaveBeenCalledWith(
				`https://api.example.com${path}`,
				expect.objectContaining({ credentials: 'include' })
			)
		})
	})

	describe('configuration', () => {
		it('should use default baseURL if not provided', () => {
			const defaultAdapter = new EntityAdapter()
			expect(defaultAdapter).toBeDefined()
		})
	})
})
