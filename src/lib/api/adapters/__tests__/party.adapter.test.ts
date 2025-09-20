/**
 * Tests for PartyAdapter
 *
 * These tests verify party CRUD operations, grid management,
 * and conflict resolution functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PartyAdapter } from '../party.adapter'
import type { Party, GridWeapon, GridSummon, GridCharacter } from '../party.adapter'

describe('PartyAdapter', () => {
	let adapter: PartyAdapter
	let originalFetch: typeof global.fetch

	const mockParty: Party = {
		id: '123',
		shortcode: 'ABC123',
		name: 'Test Party',
		description: 'Test description',
		visibility: 'public',
		user: {
			id: 'user-1',
			username: 'testuser'
		},
		job: {
			id: 'job-1',
			name: { en: 'Warrior' },
			skills: [
				{
					id: 'skill-1',
					name: { en: 'Rage' },
					slot: 1
				}
			]
		},
		raid: {
			id: 'raid-1',
			name: { en: 'Proto Bahamut' },
			group: {
				id: 'group-1',
				name: { en: 'Tier 1' }
			}
		},
		gridWeapons: [],
		gridSummons: [],
		gridCharacters: [],
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	}

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new PartyAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	describe('CRUD operations', () => {
		it('should create a new party', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockParty
			})

			const result = await adapter.create({
				name: 'Test Party',
				description: 'Test description',
				visibility: 'public'
			})

			expect(result).toEqual(mockParty)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						party: {
							name: 'Test Party',
							description: 'Test description',
							visibility: 'public'
						}
					})
				})
			)
		})

		it('should get a party by shortcode', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockParty
			})

			const result = await adapter.getByShortcode('ABC123')

			expect(result).toEqual(mockParty)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/ABC123',
				expect.any(Object)
			)
		})

		it('should update a party', async () => {
			const updatedParty = { ...mockParty, name: 'Updated Party' }
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => updatedParty
			})

			const result = await adapter.update({
				shortcode: 'ABC123',
				name: 'Updated Party'
			})

			expect(result).toEqual(updatedParty)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/ABC123',
				expect.objectContaining({
					method: 'PATCH',
					body: JSON.stringify({
						party: { name: 'Updated Party' }
					})
				})
			)
		})

		it('should delete a party', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({})
			})

			await adapter.delete('ABC123')

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/ABC123',
				expect.objectContaining({
					method: 'DELETE'
				})
			)
		})

		it('should remix a party', async () => {
			const remixedParty = { ...mockParty, id: '456', shortcode: 'DEF456' }
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => remixedParty
			})

			const result = await adapter.remix('ABC123')

			expect(result).toEqual(remixedParty)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/ABC123/remix',
				expect.objectContaining({
					method: 'POST'
				})
			)
		})
	})

	describe('user parties listing', () => {
		it('should list user parties with filters', async () => {
			const mockResponse = {
				results: [mockParty],
				total: 1,
				page: 1,
				totalPages: 1
			}

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockResponse
			})

			const result = await adapter.listUserParties({
				username: 'testuser',
				page: 1,
				per: 20,
				visibility: 'public',
				raidId: 'raid-1'
			})

			expect(result).toEqual(mockResponse)
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/users/testuser/parties'),
				expect.objectContaining({
					method: 'GET'
				})
			)

			// Verify query parameters were included
			const callUrl = (global.fetch as any).mock.calls[0][0]
			expect(callUrl).toContain('page=1')
			expect(callUrl).toContain('per=20')
			expect(callUrl).toContain('visibility=public')
			expect(callUrl).toContain('raid_id=raid-1')
		})
	})

	describe('grid management', () => {
		it('should update grid weapons', async () => {
			const mockGridWeapons: GridWeapon[] = [
				{
					id: 'gw-1',
					position: 1,
					mainhand: true,
					uncapLevel: 5,
					transcendenceStage: 0,
					weaponKeys: [],
					weapon: {
						id: 'weapon-1',
						granblueId: 'w-1',
						name: { en: 'Sword' },
						element: 1,
						rarity: 5
					}
				}
			]

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					grid_weapons: mockGridWeapons.map(gw => ({
						...gw,
						uncap_level: gw.uncapLevel,
						transcendence_stage: gw.transcendenceStage,
						weapon_keys: gw.weaponKeys
					}))
				})
			})

			const result = await adapter.updateGridWeapons({
				shortcode: 'ABC123',
				updates: [
					{
						position: 1,
						weaponId: 'weapon-1',
						mainhand: true,
						uncapLevel: 5
					}
				]
			})

			expect(result.gridWeapons).toEqual(mockGridWeapons)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/ABC123/grid_weapons',
				expect.objectContaining({
					method: 'PATCH',
					body: JSON.stringify({
						grid_weapons: [
							{
								position: 1,
								weapon_id: 'weapon-1',
								mainhand: true,
								uncap_level: 5
							}
						]
					})
				})
			)
		})

		it('should update grid summons', async () => {
			const mockGridSummons: GridSummon[] = [
				{
					id: 'gs-1',
					position: 1,
					quickSummon: true,
					transcendenceStage: 2,
					summon: {
						id: 'summon-1',
						granblueId: 's-1',
						name: { en: 'Bahamut' },
						element: 6,
						rarity: 5
					}
				}
			]

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					grid_summons: mockGridSummons.map(gs => ({
						...gs,
						quick_summon: gs.quickSummon,
						transcendence_stage: gs.transcendenceStage
					}))
				})
			})

			const result = await adapter.updateGridSummons({
				shortcode: 'ABC123',
				updates: [
					{
						position: 1,
						summonId: 'summon-1',
						quickSummon: true,
						transcendenceStage: 2
					}
				]
			})

			expect(result.gridSummons).toEqual(mockGridSummons)
		})

		it('should update grid characters', async () => {
			const mockGridCharacters: GridCharacter[] = [
				{
					id: 'gc-1',
					position: 1,
					uncapLevel: 5,
					transcendenceStage: 1,
					character: {
						id: 'char-1',
						granblueId: 'c-1',
						name: { en: 'Katalina' },
						element: 2,
						rarity: 5
					}
				}
			]

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					grid_characters: mockGridCharacters.map(gc => ({
						...gc,
						uncap_level: gc.uncapLevel,
						transcendence_stage: gc.transcendenceStage
					}))
				})
			})

			const result = await adapter.updateGridCharacters({
				shortcode: 'ABC123',
				updates: [
					{
						position: 1,
						characterId: 'char-1',
						uncapLevel: 5,
						transcendenceStage: 1
					}
				]
			})

			expect(result.gridCharacters).toEqual(mockGridCharacters)
		})

		it('should handle grid conflicts', async () => {
			const conflictResponse = {
				grid_weapons: [],
				conflicts: {
					conflicts: [
						{
							type: 'weapon',
							position: 1,
							existing: { id: 'weapon-1' },
							new: { id: 'weapon-2' }
						}
					],
					resolved: false
				}
			}

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => conflictResponse
			})

			const result = await adapter.updateGridWeapons({
				shortcode: 'ABC123',
				updates: [
					{
						position: 1,
						weaponId: 'weapon-2'
					}
				]
			})

			expect(result.conflicts).toBeDefined()
			expect(result.conflicts?.resolved).toBe(false)
			expect(result.conflicts?.conflicts).toHaveLength(1)
		})
	})

	describe('job management', () => {
		it('should update party job', async () => {
			const updatedParty = {
				...mockParty,
				job: {
					id: 'job-2',
					name: { en: 'Mage' },
					skills: [
						{
							id: 'skill-2',
							name: { en: 'Fireball' },
							slot: 1
						}
					],
					accessory: {
						id: 'acc-1',
						name: { en: 'Magic Ring' }
					}
				}
			}

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => updatedParty
			})

			const result = await adapter.updateJob(
				'ABC123',
				'job-2',
				[{ id: 'skill-2', slot: 1 }],
				'acc-1'
			)

			expect(result).toEqual(updatedParty)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/ABC123',
				expect.objectContaining({
					method: 'PATCH',
					body: JSON.stringify({
						party: {
							job_id: 'job-2',
							job_skills_attributes: [{ id: 'skill-2', slot: 1 }],
							job_accessory_id: 'acc-1'
						}
					})
				})
			)
		})
	})

	describe('cache management', () => {
		it('should cache party retrieval', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockParty
			})

			// First call
			await adapter.getByShortcode('ABC123')

			// Second call (should use cache)
			await adapter.getByShortcode('ABC123')

			// Should only call fetch once due to caching
			expect(global.fetch).toHaveBeenCalledTimes(1)
		})

		it('should clear party cache', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockParty
			})

			// First call
			await adapter.getByShortcode('ABC123')

			// Clear cache
			adapter.clearPartyCache('ABC123')

			// Second call (should not use cache)
			await adapter.getByShortcode('ABC123')

			// Should call fetch twice since cache was cleared
			expect(global.fetch).toHaveBeenCalledTimes(2)
		})
	})

	describe('error handling', () => {
		it('should handle 404 errors', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				statusText: 'Not Found',
				json: async () => ({ error: 'Party not found' })
			})

			await expect(adapter.getByShortcode('INVALID')).rejects.toThrow()
		})

		it('should handle validation errors', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 422,
				statusText: 'Unprocessable Entity',
				json: async () => ({
					errors: {
						name: ['is too long']
					}
				})
			})

			await expect(
				adapter.create({
					name: 'A'.repeat(256)
				})
			).rejects.toThrow()
		})
	})
})