/**
 * Tests for GridAdapter
 *
 * These tests verify grid item CRUD operations, position management,
 * uncap updates, and conflict resolution functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GridAdapter } from '../grid.adapter'
import type { GridWeapon, GridCharacter, GridSummon } from '../grid.adapter'

describe('GridAdapter', () => {
	let adapter: GridAdapter
	let originalFetch: typeof global.fetch

	const mockGridWeapon: GridWeapon = {
		id: 'gw-1',
		partyId: 'party-1',
		weaponId: 'weapon-1',
		position: 1,
		mainhand: true,
		uncapLevel: 5,
		transcendenceStage: 0
	}

	const mockGridCharacter: GridCharacter = {
		id: 'gc-1',
		partyId: 'party-1',
		characterId: 'char-1',
		position: 1,
		uncapLevel: 5,
		transcendenceStage: 1
	}

	const mockGridSummon: GridSummon = {
		id: 'gs-1',
		partyId: 'party-1',
		summonId: 'summon-1',
		position: 1,
		quickSummon: true,
		uncapLevel: 5,
		transcendenceStage: 2
	}

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new GridAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	describe('weapon operations', () => {
		it('should create a grid weapon', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockGridWeapon
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
						party_id: 'party-1',
						weapon_id: 'weapon-1',
						position: 1,
						mainhand: true
					})
				})
			)
		})

		it('should update a grid weapon', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ ...mockGridWeapon, uncapLevel: 6 })
			})

			const result = await adapter.updateWeapon('gw-1', {
				uncapLevel: 6
			})

			expect(result.uncapLevel).toBe(6)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/grid_weapons/gw-1',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify({ uncap_level: 6 })
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

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/grid_weapons',
				expect.objectContaining({
					method: 'DELETE',
					body: JSON.stringify({
						id: 'gw-1',
						party_id: 'party-1'
					})
				})
			)
		})

		it('should update weapon uncap level', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ ...mockGridWeapon, uncapLevel: 6 })
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
						id: 'gw-1',
						party_id: 'party-1',
						uncap_level: 6,
						transcendence_step: 1
					})
				})
			)
		})

		it('should resolve weapon conflicts', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockGridWeapon
			})

			const result = await adapter.resolveWeaponConflict({
				partyId: 'party-1',
				incomingId: 'weapon-2',
				position: 1,
				conflictingIds: ['gw-1']
			})

			expect(result).toEqual(mockGridWeapon)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/grid_weapons/resolve',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						party_id: 'party-1',
						incoming_id: 'weapon-2',
						position: 1,
						conflicting_ids: ['gw-1']
					})
				})
			)
		})

		it('should update weapon position', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ ...mockGridWeapon, position: 2 })
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

	describe('character operations', () => {
		it('should create a grid character', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockGridCharacter
			})

			const result = await adapter.createCharacter({
				partyId: 'party-1',
				characterId: 'char-1',
				position: 1
			})

			expect(result).toEqual(mockGridCharacter)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/grid_characters',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						party_id: 'party-1',
						character_id: 'char-1',
						position: 1
					})
				})
			)
		})

		it('should update character position', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ ...mockGridCharacter, position: 2 })
			})

			const result = await adapter.updateCharacterPosition({
				partyId: 'party-1',
				id: 'gc-1',
				position: 2
			})

			expect(result.position).toBe(2)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/party-1/grid_characters/gc-1/position',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify({ position: 2 })
				})
			)
		})

		it('should swap character positions', async () => {
			const mockResponse = {
				source: mockGridCharacter,
				target: { ...mockGridCharacter, id: 'gc-2', position: 2 }
			}

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockResponse
			})

			const result = await adapter.swapCharacters({
				partyId: 'party-1',
				sourceId: 'gc-1',
				targetId: 'gc-2'
			})

			expect(result).toEqual(mockResponse)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/party-1/grid_characters/swap',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						source_id: 'gc-1',
						target_id: 'gc-2'
					})
				})
			)
		})
	})

	describe('summon operations', () => {
		it('should create a grid summon', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockGridSummon
			})

			const result = await adapter.createSummon({
				partyId: 'party-1',
				summonId: 'summon-1',
				position: 1,
				quickSummon: true
			})

			expect(result).toEqual(mockGridSummon)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/grid_summons',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						party_id: 'party-1',
						summon_id: 'summon-1',
						position: 1,
						quick_summon: true
					})
				})
			)
		})

		it('should update quick summon', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ ...mockGridSummon, quickSummon: false })
			})

			const result = await adapter.updateQuickSummon({
				id: 'gs-1',
				partyId: 'party-1',
				quickSummon: false
			})

			expect(result.quickSummon).toBe(false)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/grid_summons/update_quick_summon',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						id: 'gs-1',
						party_id: 'party-1',
						quick_summon: false
					})
				})
			)
		})

		it('should update summon position', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ ...mockGridSummon, position: 2 })
			})

			const result = await adapter.updateSummonPosition({
				partyId: 'party-1',
				id: 'gs-1',
				position: 2
			})

			expect(result.position).toBe(2)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/party-1/grid_summons/gs-1/position',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify({ position: 2 })
				})
			)
		})

		it('should swap summon positions', async () => {
			const mockResponse = {
				source: mockGridSummon,
				target: { ...mockGridSummon, id: 'gs-2', position: 2 }
			}

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockResponse
			})

			const result = await adapter.swapSummons({
				partyId: 'party-1',
				sourceId: 'gs-1',
				targetId: 'gs-2'
			})

			expect(result).toEqual(mockResponse)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/party-1/grid_summons/swap',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						source_id: 'gs-1',
						target_id: 'gs-2'
					})
				})
			)
		})
	})

	describe('cache management', () => {
		it('should clear grid cache', () => {
			const clearCacheSpy = vi.spyOn(adapter, 'clearCache')

			adapter.clearGridCache('party-1')

			expect(clearCacheSpy).toHaveBeenCalledWith('/parties/party-1/grid')
		})

		it('should clear all grid caches', () => {
			const clearCacheSpy = vi.spyOn(adapter, 'clearCache')

			adapter.clearGridCache()

			expect(clearCacheSpy).toHaveBeenCalledWith('/grid')
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

			await expect(
				adapter.updateWeapon('invalid-id', { uncapLevel: 5 })
			).rejects.toThrow()
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