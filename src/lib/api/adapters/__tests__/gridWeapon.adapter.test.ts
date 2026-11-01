/**
 * Tests for GridWeaponAdapter
 *
 * These tests verify grid weapon CRUD operations, position management,
 * uncap updates, and conflict resolution functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GridWeaponAdapter } from '../gridWeapon.adapter'
import type { GridWeapon } from '$lib/types/api/party'
import type { Weapon } from '$lib/types/api/entities'

describe('GridWeaponAdapter', () => {
	let adapter: GridWeaponAdapter
	let originalFetch: typeof global.fetch

	const mockWeapon: Weapon = {
		id: 'weapon-1',
		granblueId: '1040001',
		name: { en: 'Test Weapon', ja: 'テスト武器' },
		rarity: 5,
		element: 1,
		maxLevel: 150,
		maxSkillLevel: 15,
		maxAwakeningLevel: 5,
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
		proficiency: 1,
		uncap: { flb: true, ulb: true, transcendence: false },
		hp: { minHp: 100, maxHp: 500, maxHpFlb: 600, maxHpUlb: 700 },
		atk: { minAtk: 200, maxAtk: 1000, maxAtkFlb: 1200, maxAtkUlb: 1400 }
	}

	const mockGridWeapon: GridWeapon = {
		id: 'gw-1',
		position: 1,
		mainhand: true,
		uncapLevel: 5,
		transcendenceStep: 0,
		weapon: mockWeapon
	}

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new GridWeaponAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	describe('weapon operations', () => {
		it('should create a grid weapon', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ gridWeapon: mockGridWeapon })
			})

			const result = await adapter.createWeapon({
				partyId: 'party-1',
				weaponId: 'weapon-1',
				position: 1,
				mainhand: true
			})

			expect(result).toEqual(mockGridWeapon)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/grid_weapons',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						weapon: {
							party_id: 'party-1',
							weapon_id: 'weapon-1',
							position: 1,
							mainhand: true
						}
					})
				})
			)
		})

		it('should update a grid weapon', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ gridWeapon: { ...mockGridWeapon, uncapLevel: 6 } })
			})

			const result = await adapter.updateWeapon('gw-1', {
				uncapLevel: 6
			})

			expect(result.uncapLevel).toBe(6)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/grid_weapons/gw-1',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify({ weapon: { uncap_level: 6 } })
				})
			)
		})

		it('should send level 1 when clearing a weapon awakening', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ gridWeapon: mockGridWeapon })
			})

			await adapter.updateWeapon('gw-1', { awakening: null } as never)

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/grid_weapons/gw-1',
				expect.objectContaining({
					body: JSON.stringify({ weapon: { awakening_id: null, awakening_level: 1 } })
				})
			)
		})

		it('should delete a grid weapon', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({})
			})

			await adapter.deleteWeapon({
				id: 'gw-1',
				partyId: 'party-1'
			})

			// ID-based delete uses REST-style URL with no body
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/grid_weapons/gw-1',
				expect.objectContaining({
					method: 'DELETE'
				})
			)
		})

		it('should update weapon uncap level', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ gridWeapon: { ...mockGridWeapon, uncapLevel: 6 } })
			})

			const result = await adapter.updateWeaponUncap({
				id: 'gw-1',
				partyId: 'party-1',
				uncapLevel: 6,
				transcendenceStep: 1
			})

			expect(result.uncapLevel).toBe(6)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/grid_weapons/update_uncap',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						weapon: {
							id: 'gw-1',
							party_id: 'party-1',
							uncap_level: 6,
							transcendence_step: 1
						}
					})
				})
			)
		})

		it('should resolve weapon conflicts', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ gridWeapon: mockGridWeapon })
			})

			const result = await adapter.resolveWeaponConflict({
				partyId: 'party-1',
				incoming: 'weapon-2',
				position: 1,
				conflicting: ['gw-1']
			})

			expect(result).toEqual(mockGridWeapon)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/grid_weapons/resolve',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						resolve: {
							party_id: 'party-1',
							incoming: 'weapon-2',
							position: 1,
							conflicting: ['gw-1']
						}
					})
				})
			)
		})

		it('should update weapon position', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ gridWeapon: { ...mockGridWeapon, position: 2 } })
			})

			const result = await adapter.updateWeaponPosition({
				partyId: 'party-1',
				id: 'gw-1',
				position: 2
			})

			expect(result.position).toBe(2)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/party-1/grid_weapons/gw-1/position',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify({ position: 2 })
				})
			)
		})

		it('should swap weapon positions', async () => {
			const mockResponse = {
				source: mockGridWeapon,
				target: { ...mockGridWeapon, id: 'gw-2', position: 2 }
			}

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockResponse
			})

			const result = await adapter.swapWeapons({
				partyId: 'party-1',
				sourceId: 'gw-1',
				targetId: 'gw-2'
			})

			expect(result).toEqual(mockResponse)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/party-1/grid_weapons/swap',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						source_id: 'gw-1',
						target_id: 'gw-2'
					})
				})
			)
		})
	})

	describe('error handling', () => {
		it('should handle 404 errors', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				statusText: 'Not Found',
				json: async () => ({ error: 'Grid weapon not found' })
			})

			await expect(adapter.updateWeapon('invalid-id', { uncapLevel: 5 })).rejects.toThrow()
		})

		it('should handle validation errors', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 422,
				statusText: 'Unprocessable Entity',
				json: async () => ({
					errors: {
						position: ['is already taken']
					}
				})
			})

			await expect(
				adapter.createWeapon({
					partyId: 'party-1',
					weaponId: 'weapon-1',
					position: 1
				})
			).rejects.toThrow()
		})
	})
})
