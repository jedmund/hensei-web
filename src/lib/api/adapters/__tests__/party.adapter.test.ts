/**
 * Tests for PartyAdapter
 *
 * These tests verify party CRUD operations, grid management,
 * and conflict resolution functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PartyAdapter } from '../party.adapter'
import type { Party } from '../party.adapter'

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
		it('should perform batch grid updates', async () => {
			const mockResponse = {
				party: mockParty,
				operations_applied: 2,
				changes: [
					{
						entity: 'weapon',
						id: 'gw-1',
						action: 'moved',
						from: 1,
						to: 2
					},
					{
						entity: 'character',
						id: 'gc-1',
						action: 'swapped',
						with: 'gc-2'
					}
				]
			}

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockResponse
			})

			const operations = [
				{
					type: 'move' as const,
					entity: 'weapon' as const,
					id: 'gw-1',
					position: 2
				},
				{
					type: 'swap' as const,
					entity: 'character' as const,
					sourceId: 'gc-1',
					targetId: 'gc-2'
				}
			]

			const result = await adapter.gridUpdate(
				'ABC123',
				operations,
				{ maintainCharacterSequence: true }
			)

			expect(result.operationsApplied).toBe(2)
			expect(result.changes).toHaveLength(2)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/ABC123/grid_update',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						operations: [
							{
								type: 'move',
								entity: 'weapon',
								id: 'gw-1',
								position: 2
							},
							{
								type: 'swap',
								entity: 'character',
								source_id: 'gc-1',
								target_id: 'gc-2'
							}
						],
						options: { maintain_character_sequence: true }
					})
				})
			)
		})
	})

	describe('job management', () => {
		it('should update party job', async () => {
			const updatedParty = {
				...mockParty,
				job: {
					id: 'job-2',
					name: { en: 'Mage' },
					skills: []
				}
			}

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => updatedParty
			})

			const result = await adapter.updateJob('ABC123', 'job-2')

			expect(result).toEqual(updatedParty)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/ABC123/jobs',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify({
						job_id: 'job-2'
					})
				})
			)
		})

		it('should update job skills', async () => {
			const updatedParty = {
				...mockParty,
				job: {
					...mockParty.job!,
					skills: [
						{ id: 'skill-1', name: { en: 'Rage' }, slot: 1 },
						{ id: 'skill-2', name: { en: 'Heal' }, slot: 2 }
					]
				}
			}

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => updatedParty
			})

			const result = await adapter.updateJobSkills(
				'ABC123',
				[
					{ id: 'skill-1', slot: 1 },
					{ id: 'skill-2', slot: 2 }
				]
			)

			expect(result).toEqual(updatedParty)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/ABC123/job_skills',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify({
						skills: [
							{ id: 'skill-1', slot: 1 },
							{ id: 'skill-2', slot: 2 }
						]
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