/**
 * Tests for CharacterAdapter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CharacterAdapter } from '../character.adapter'
import type { Character } from '../character.adapter'

describe('CharacterAdapter', () => {
	let adapter: CharacterAdapter
	let originalFetch: typeof global.fetch

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

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new CharacterAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
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
					credentials: 'include'
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

	it('should handle network errors', async () => {
		global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

		await expect(adapter.getCharacter('char-1')).rejects.toThrow('Network error')
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

			const result = await adapter.validateCharacterGranblueId('1040001000')

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
				character_id: 'item-1',
				granblue_id: '1040001000',
				updated_at: '2026-10-31T00:00:00Z'
			})

			const result = await adapter.getCharacterDownloadStatus('item-1')

			expect(result).toMatchObject({
				status: 'processing',
				progress: 50,
				imagesDownloaded: 3,
				imagesTotal: 6,
				characterId: 'item-1',
				granblueId: '1040001000',
				updatedAt: '2026-10-31T00:00:00Z'
			})
		})
	})
})
