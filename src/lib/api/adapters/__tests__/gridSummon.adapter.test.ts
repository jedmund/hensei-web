/**
 * Tests for GridSummonAdapter
 *
 * These tests verify grid summon creation, quick summon updates and
 * position management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GridSummonAdapter } from '../gridSummon.adapter'
import type { GridSummon } from '$lib/types/api/party'
import type { Summon } from '$lib/types/api/entities'

describe('GridSummonAdapter', () => {
	let adapter: GridSummonAdapter
	let originalFetch: typeof global.fetch

	const mockSummon: Summon = {
		id: 'summon-1',
		granblueId: '2040001',
		name: { en: 'Test Summon', ja: 'テスト召喚石' },
		rarity: 5,
		element: 1,
		maxLevel: 150,
		uncap: { flb: true, ulb: true, transcendence: false },
		subaura: false,
		limit: false,
		hp: { minHp: 100, maxHp: 500, maxHpFlb: 600, maxHpUlb: 700 },
		atk: { minAtk: 200, maxAtk: 1000, maxAtkFlb: 1200, maxAtkUlb: 1400 }
	}

	const mockGridSummon: GridSummon = {
		id: 'gs-1',
		position: 1,
		quickSummon: true,
		uncapLevel: 5,
		transcendenceStep: 2,
		summon: mockSummon
	}

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new GridSummonAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	describe('summon operations', () => {
		it('should create a grid summon', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ gridSummon: mockGridSummon })
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
						summon: {
							party_id: 'party-1',
							summon_id: 'summon-1',
							position: 1,
							quick_summon: true
						}
					})
				})
			)
		})

		it('should update quick summon and return every summon it changed', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					summons: [
						{ ...mockGridSummon, quickSummon: true },
						{ ...mockGridSummon, id: 'gs-2', quickSummon: false }
					]
				})
			})

			const result = await adapter.updateQuickSummon({
				id: 'gs-1',
				partyId: 'party-1',
				quickSummon: true
			})

			expect(result.map((s) => [s.id, s.quickSummon])).toEqual([
				['gs-1', true],
				['gs-2', false]
			])
		})

		it('should return no summons when the slot cannot be a quick summon', async () => {
			global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 })

			const result = await adapter.updateQuickSummon({
				id: 'gs-6',
				partyId: 'party-1',
				quickSummon: true
			})

			expect(result).toEqual([])
		})

		it('should send the quick summon params', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ summons: [{ ...mockGridSummon, quickSummon: false }] })
			})

			await adapter.updateQuickSummon({
				id: 'gs-1',
				partyId: 'party-1',
				quickSummon: false
			})

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/grid_summons/update_quick_summon',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						summon: {
							id: 'gs-1',
							party_id: 'party-1',
							quick_summon: false
						}
					})
				})
			)
		})

		it('should update summon position', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ gridSummon: { ...mockGridSummon, position: 2 } })
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
})
