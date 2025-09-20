/**
 * Tests for SearchAdapter
 *
 * These tests verify search functionality including filtering,
 * pagination, and proper request/response handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SearchAdapter } from '../search.adapter'
import type { SearchParams, SearchResponse } from '../search.adapter'

describe('SearchAdapter', () => {
	let adapter: SearchAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new SearchAdapter({
			baseURL: 'https://api.example.com'
		})
	})

	afterEach(() => {
		global.fetch = originalFetch
		adapter.cancelAll()
	})

	describe('searchAll', () => {
		it('should search across all entity types', async () => {
			const mockResponse: SearchResponse = {
				results: [
					{
						id: '1',
						granblueId: 'weapon_1',
						name: { en: 'Bahamut Sword', ja: 'バハムートソード' },
						element: 1,
						rarity: 5,
						searchableType: 'Weapon',
						imageUrl: 'https://example.com/weapon1.jpg'
					},
					{
						id: '2',
						granblueId: 'character_1',
						name: { en: 'Bahamut', ja: 'バハムート' },
						element: 6,
						rarity: 5,
						searchableType: 'Character',
						imageUrl: 'https://example.com/character1.jpg'
					}
				],
				total: 2,
				page: 1,
				totalPages: 1,
				meta: {
					count: 2,
					page: 1,
					perPage: 20,
					totalPages: 1
				}
			}

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					results: [
						{
							id: '1',
							granblue_id: 'weapon_1',
							name: { en: 'Bahamut Sword', ja: 'バハムートソード' },
							element: 1,
							rarity: 5,
							searchable_type: 'Weapon',
							image_url: 'https://example.com/weapon1.jpg'
						},
						{
							id: '2',
							granblue_id: 'character_1',
							name: { en: 'Bahamut', ja: 'バハムート' },
							element: 6,
							rarity: 5,
							searchable_type: 'Character',
							image_url: 'https://example.com/character1.jpg'
						}
					],
					total: 2,
					page: 1,
					total_pages: 1,
					meta: {
						count: 2,
						page: 1,
						per_page: 20,
						total_pages: 1
					}
				})
			})

			const params: SearchParams = {
				query: 'bahamut',
				locale: 'en',
				page: 1
			}

			const result = await adapter.searchAll(params)

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/search/all',
				expect.objectContaining({
					method: 'POST',
					credentials: 'omit',
					body: JSON.stringify({
						locale: 'en',
						page: 1,
						query: 'bahamut'
					})
				})
			)

			expect(result).toEqual(mockResponse)
		})

		it('should include filters when provided', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ results: [] })
			})

			const params: SearchParams = {
				query: 'sword',
				filters: {
					element: [1, 2],
					rarity: [5],
					extra: true
				}
			}

			await adapter.searchAll(params)

			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: JSON.stringify({
						locale: 'en',
						page: 1,
						query: 'sword',
						filters: {
							element: [1, 2],
							rarity: [5],
							extra: true
						}
					})
				})
			)
		})

		it('should handle exclude parameter', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ results: [] })
			})

			const params: SearchParams = {
				query: 'test',
				exclude: ['1', '2', '3']
			}

			await adapter.searchAll(params)

			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: JSON.stringify({
						locale: 'en',
						page: 1,
						query: 'test',
						exclude: ['1', '2', '3']
					})
				})
			)
		})

		it('should cache results when query is provided', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ results: [{ id: '1' }] })
			})

			// First call
			await adapter.searchAll({ query: 'test' })
			expect(global.fetch).toHaveBeenCalledTimes(1)

			// Second call should use cache
			await adapter.searchAll({ query: 'test' })
			expect(global.fetch).toHaveBeenCalledTimes(1)
		})

		it('should not cache results when query is empty', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ results: [] })
			})

			// First call
			await adapter.searchAll({})
			expect(global.fetch).toHaveBeenCalledTimes(1)

			// Second call should not use cache
			await adapter.searchAll({})
			expect(global.fetch).toHaveBeenCalledTimes(2)
		})
	})

	describe('searchWeapons', () => {
		it('should search for weapons with appropriate filters', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ results: [] })
			})

			const params: SearchParams = {
				query: 'sword',
				filters: {
					element: [1],
					proficiency1: [2],
					extra: false
				},
				per: 50
			}

			await adapter.searchWeapons(params)

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/search/weapons',
				expect.objectContaining({
					method: 'POST',
					credentials: 'omit',
					body: JSON.stringify({
						locale: 'en',
						page: 1,
						per: 50,
						query: 'sword',
						filters: {
							element: [1],
							proficiency1: [2],
							extra: false
						}
					})
				})
			)
		})

		it('should not include character-specific filters', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ results: [] })
			})

			const params: SearchParams = {
				query: 'test',
				filters: {
					proficiency2: [1], // Character-only filter
					subaura: true // Summon-only filter
				}
			}

			await adapter.searchWeapons(params)

			const calledBody = JSON.parse((global.fetch as any).mock.calls[0][1].body)
			expect(calledBody.filters).toBeUndefined()
		})
	})

	describe('searchCharacters', () => {
		it('should search for characters with appropriate filters', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ results: [] })
			})

			const params: SearchParams = {
				query: 'katalina',
				filters: {
					element: [2],
					proficiency1: [1],
					proficiency2: [3]
				}
			}

			await adapter.searchCharacters(params)

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/search/characters',
				expect.objectContaining({
					body: JSON.stringify({
						locale: 'en',
						page: 1,
						query: 'katalina',
						filters: {
							element: [2],
							proficiency1: [1],
							proficiency2: [3]
						}
					})
				})
			)
		})
	})

	describe('searchSummons', () => {
		it('should search for summons with appropriate filters', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ results: [] })
			})

			const params: SearchParams = {
				query: 'bahamut',
				filters: {
					element: [6],
					rarity: [5],
					subaura: true
				}
			}

			await adapter.searchSummons(params)

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/search/summons',
				expect.objectContaining({
					body: JSON.stringify({
						locale: 'en',
						page: 1,
						query: 'bahamut',
						filters: {
							element: [6],
							rarity: [5],
							subaura: true
						}
					})
				})
			)
		})
	})

	describe('clearSearchCache', () => {
		it('should clear cached search results', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ results: [{ id: '1' }] })
			})

			// Cache a search
			await adapter.searchAll({ query: 'test' })
			expect(global.fetch).toHaveBeenCalledTimes(1)

			// Clear cache
			adapter.clearSearchCache()

			// Should fetch again
			await adapter.searchAll({ query: 'test' })
			expect(global.fetch).toHaveBeenCalledTimes(2)
		})
	})

	describe('error handling', () => {
		it('should handle server errors', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
				json: async () => ({ error: 'Server error' })
			})

			await expect(adapter.searchAll({ query: 'test' })).rejects.toMatchObject({
				code: 'SERVER_ERROR',
				status: 500
			})
		})

		it('should handle network errors', async () => {
			global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

			await expect(adapter.searchAll({ query: 'test' })).rejects.toMatchObject({
				code: 'UNKNOWN_ERROR'
			})
		})
	})

	describe('pagination', () => {
		it('should handle pagination parameters', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					results: [],
					page: 2,
					total_pages: 5,
					meta: {
						count: 0,
						page: 2,
						per_page: 20,
						total_pages: 5
					}
				})
			})

			const result = await adapter.searchAll({
				query: 'test',
				page: 2,
				per: 20
			})

			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: JSON.stringify({
						locale: 'en',
						page: 2,
						per: 20,
						query: 'test'
					})
				})
			)

			expect(result.page).toBe(2)
			expect(result.totalPages).toBe(5)
		})
	})
})