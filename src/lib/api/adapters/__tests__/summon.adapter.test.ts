/**
 * Tests for SummonAdapter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SummonAdapter } from '../summon.adapter'
import type { Summon } from '../summon.adapter'

describe('SummonAdapter', () => {
	let adapter: SummonAdapter
	let originalFetch: typeof global.fetch

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
		adapter = new SummonAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
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
					credentials: 'include'
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

	it('should handle JSON parse errors', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => {
				throw new Error('Invalid JSON')
			}
		})

		await expect(adapter.getSummon('summon-1')).rejects.toThrow()
	})

	describe('validation and download status (snake_case API bodies)', () => {
		const mockJson = (body: unknown) =>
			vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body })

		it('maps validation fields', async () => {
			global.fetch = mockJson({
				valid: true,
				granblue_id: '1040001000',
				exists_in_db: true,
				image_urls: { main: 'https://example.com/main.jpg' }
			})

			const result = await adapter.validateSummonGranblueId('1040001000')

			expect(result).toMatchObject({
				valid: true,
				granblueId: '1040001000',
				existsInDb: true,
				imageUrls: { main: 'https://example.com/main.jpg' }
			})
		})

		it('maps download status fields', async () => {
			global.fetch = mockJson({
				status: 'processing',
				progress: 50,
				images_downloaded: 3,
				images_total: 6,
				summon_id: 'item-1',
				granblue_id: '1040001000',
				updated_at: '2026-10-31T00:00:00Z'
			})

			const result = await adapter.getSummonDownloadStatus('item-1')

			expect(result).toMatchObject({
				status: 'processing',
				progress: 50,
				imagesDownloaded: 3,
				imagesTotal: 6,
				summonId: 'item-1',
				granblueId: '1040001000',
				updatedAt: '2026-10-31T00:00:00Z'
			})
		})
	})
})
