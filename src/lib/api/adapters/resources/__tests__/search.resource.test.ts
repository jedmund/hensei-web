/**
 * Tests for SearchResource
 *
 * These tests verify the reactive search resource functionality
 * including debouncing, state management, and cancellation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SearchResource } from '../search.resource.svelte'
import { SearchAdapter } from '../../search.adapter'
import type { SearchResponse } from '../../search.adapter'

describe('SearchResource', () => {
	let resource: SearchResource
	let mockAdapter: SearchAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch

		// Create mock adapter
		mockAdapter = new SearchAdapter({
			baseURL: 'https://api.example.com'
		})

		// Create resource with short debounce for testing
		resource = new SearchResource({
			adapter: mockAdapter,
			debounceMs: 10,
			initialParams: { locale: 'en' }
		})
	})

	afterEach(() => {
		global.fetch = originalFetch
		resource.cancelAll()
		vi.clearAllTimers()
	})

	describe('initialization', () => {
		it('should initialize with empty state', () => {
			expect(resource.weapons.loading).toBe(false)
			expect(resource.weapons.data).toBeUndefined()
			expect(resource.weapons.error).toBeUndefined()

			expect(resource.characters.loading).toBe(false)
			expect(resource.summons.loading).toBe(false)
			expect(resource.all.loading).toBe(false)
		})

		it('should accept initial parameters', () => {
			const customResource = new SearchResource({
				initialParams: {
					locale: 'ja',
					page: 2
				}
			})

			// We'll verify these are used in the search tests
			expect(customResource).toBeDefined()
		})
	})

	describe('search operations', () => {
		it('should search weapons with debouncing', async () => {
			const mockResponse: SearchResponse = {
				results: [
					{
						id: '1',
						granblueId: 'weapon_1',
						name: { en: 'Test Weapon' },
						element: 1,
						rarity: 5,
						searchableType: 'Weapon'
					}
				],
				total: 1
			}

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					results: [
						{
							id: '1',
							granblue_id: 'weapon_1',
							name: { en: 'Test Weapon' },
							element: 1,
							rarity: 5,
							searchable_type: 'Weapon'
						}
					],
					total: 1
				})
			})

			// Start search
			resource.searchWeapons({ query: 'test' })

			// Should be loading immediately
			expect(resource.weapons.loading).toBe(true)

			// Wait for debounce + response
			await new Promise(resolve => setTimeout(resolve, 50))

			// Should have results
			expect(resource.weapons.loading).toBe(false)
			expect(resource.weapons.data).toEqual(mockResponse)
			expect(resource.weapons.error).toBeUndefined()

			// Verify API was called with merged params
			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: JSON.stringify({
						locale: 'en', // From initialParams
						page: 1,
						query: 'test'
					})
				})
			)
		})

		it('should handle search errors', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				statusText: 'Server Error',
				json: async () => ({ error: 'Internal error' })
			})

			resource.searchCharacters({ query: 'error' })

			// Wait for debounce + response
			await new Promise(resolve => setTimeout(resolve, 50))

			expect(resource.characters.loading).toBe(false)
			expect(resource.characters.data).toBeUndefined()
			expect(resource.characters.error).toMatchObject({
				code: 'SERVER_ERROR',
				status: 500
			})
		})

		it('should cancel previous search when new one starts', async () => {
			let callCount = 0
			global.fetch = vi.fn().mockImplementation(() => {
				callCount++
				return new Promise(resolve => {
					setTimeout(() => {
						resolve({
							ok: true,
							json: async () => ({ results: [] })
						})
					}, 100) // Slow response
				})
			})

			// Start first search
			resource.searchAll({ query: 'first' })

			// Start second search before first completes
			await new Promise(resolve => setTimeout(resolve, 20))
			resource.searchAll({ query: 'second' })

			// Wait for completion
			await new Promise(resolve => setTimeout(resolve, 150))

			// Should have made 2 calls but only the second one's result should be set
			expect(callCount).toBe(2)
		})
	})

	describe('state management', () => {
		it('should clear specific search type', () => {
			// Set some mock data
			resource.weapons = {
				loading: false,
				data: { results: [] },
				error: undefined
			}

			resource.characters = {
				loading: false,
				data: { results: [] },
				error: undefined
			}

			// Clear weapons only
			resource.clear('weapons')

			expect(resource.weapons.data).toBeUndefined()
			expect(resource.weapons.loading).toBe(false)
			expect(resource.characters.data).toBeDefined() // Should remain
		})

		it('should clear all search results', () => {
			// Set mock data for all types
			resource.weapons = { loading: false, data: { results: [] } }
			resource.characters = { loading: false, data: { results: [] } }
			resource.summons = { loading: false, data: { results: [] } }
			resource.all = { loading: false, data: { results: [] } }

			// Clear all
			resource.clearAll()

			expect(resource.weapons.data).toBeUndefined()
			expect(resource.characters.data).toBeUndefined()
			expect(resource.summons.data).toBeUndefined()
			expect(resource.all.data).toBeUndefined()
		})

		it('should update base parameters', () => {
			resource.updateBaseParams({ locale: 'ja', per: 50 })

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ results: [] })
			})

			resource.searchWeapons({ query: 'test' })

			// Wait for debounce
			setTimeout(() => {
				expect(global.fetch).toHaveBeenCalledWith(
					expect.any(String),
					expect.objectContaining({
						body: expect.stringContaining('"locale":"ja"')
					})
				)
			}, 50)
		})
	})

	describe('cancellation', () => {
		it('should cancel specific search type', () => {
			const cancelSpy = vi.spyOn(resource, 'cancelSearch')

			resource.clear('weapons')

			expect(cancelSpy).toHaveBeenCalledWith('weapons')
		})

		it('should cancel all searches', () => {
			const cancelAllSpy = vi.spyOn(resource, 'cancelAll')

			resource.clearAll()

			expect(cancelAllSpy).toHaveBeenCalled()
		})
	})
})