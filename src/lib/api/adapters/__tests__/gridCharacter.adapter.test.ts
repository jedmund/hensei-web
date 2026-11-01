/**
 * Tests for GridCharacterAdapter
 *
 * These tests verify grid character creation and position management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GridCharacterAdapter } from '../gridCharacter.adapter'
import type { GridCharacter } from '$lib/types/api/party'
import type { Character } from '$lib/types/api/entities'

describe('GridCharacterAdapter', () => {
	let adapter: GridCharacterAdapter
	let originalFetch: typeof global.fetch

	const mockCharacter: Character = {
		id: 'char-1',
		granblueId: '3040001',
		name: { en: 'Test Character', ja: 'テストキャラ' },
		rarity: 5,
		element: 1,
		maxLevel: 100,
		uncap: { flb: true, transcendence: true },
		special: false,
		recruits: null,
		gender: 0,
		race: { race1: 1, race2: 0 },
		proficiency: [1],
		styleSwap: false,
		hp: { minHp: 150, maxHp: 750, maxHpFlb: 900 },
		atk: { minAtk: 250, maxAtk: 1250, maxAtkFlb: 1500 }
	}

	const mockGridCharacter: GridCharacter = {
		id: 'gc-1',
		position: 1,
		uncapLevel: 5,
		transcendenceStep: 1,
		character: mockCharacter
	}

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new GridCharacterAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	describe('character operations', () => {
		it('should create a grid character', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ gridCharacter: mockGridCharacter })
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
						character: {
							party_id: 'party-1',
							character_id: 'char-1',
							position: 1
						}
					})
				})
			)
		})

		it('should update character position', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ gridCharacter: { ...mockGridCharacter, position: 2 } })
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
})
