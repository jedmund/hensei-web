/**
 * Tests for WeaponAdapter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WeaponAdapter } from '../weapon.adapter'
import type { Weapon } from '../weapon.adapter'

describe('WeaponAdapter', () => {
	let adapter: WeaponAdapter
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

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new WeaponAdapter({ baseURL: 'https://api.example.com' })
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
					credentials: 'include'
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
})
