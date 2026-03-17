import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ArtifactAdapter } from '../artifact.adapter'
import { API, EXPECTED } from './fixtures/artifact.fixtures'
import { mockApiResponse } from './fixtures/helpers'

describe('ArtifactAdapter', () => {
	let adapter: ArtifactAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new ArtifactAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	describe('reference data', () => {
		it('should unwrap artifacts from response', async () => {
			global.fetch = mockApiResponse(API.listArtifacts)

			const result = await adapter.listArtifacts()

			expect(result).toEqual(EXPECTED.listArtifacts)
		})

		it('should unwrap artifactSkills from response', async () => {
			global.fetch = mockApiResponse(API.listSkills)

			const result = await adapter.listSkills()

			expect(result).toEqual(EXPECTED.listSkills)
		})
	})

	describe('slot mapping', () => {
		beforeEach(() => {
			global.fetch = mockApiResponse(API.listSkills)
		})

		it('should map slot 1 to group_i', async () => {
			await adapter.getSkillsForSlot(1)

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('group=group_i')
		})

		it('should map slot 2 to group_i', async () => {
			await adapter.getSkillsForSlot(2)

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('group=group_i')
		})

		it('should map slot 3 to group_ii', async () => {
			await adapter.getSkillsForSlot(3)

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('group=group_ii')
		})

		it('should map slot 4 to group_iii', async () => {
			await adapter.getSkillsForSlot(4)

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('group=group_iii')
		})

		it('should throw for invalid slot 5', async () => {
			await expect(adapter.getSkillsForSlot(5)).rejects.toThrow('Invalid slot number: 5')
		})

		it('should throw for invalid slot 0', async () => {
			await expect(adapter.getSkillsForSlot(0)).rejects.toThrow('Invalid slot number: 0')
		})
	})

	describe('collection artifacts', () => {
		it('should handle artifacts response key', async () => {
			global.fetch = mockApiResponse(API.listCollectionArtifacts)

			const result = await adapter.listCollectionArtifacts('user-1')

			expect(result).toEqual(EXPECTED.listCollectionArtifacts)
		})

		it('should handle collectionArtifacts response key', async () => {
			global.fetch = mockApiResponse(API.listCollectionArtifactsAlt)

			const result = await adapter.listCollectionArtifacts('user-1')

			expect(result).toEqual(EXPECTED.listCollectionArtifactsAlt)
		})
	})

	describe('grid artifacts', () => {
		it('should build correct URL and body for createGridArtifact', async () => {
			global.fetch = mockApiResponse({ id: 'ga-1' })

			const skill1 = { modifier: 10, strength: 5, level: 2 }
			const skill2 = { modifier: 20, strength: 5, level: 2 }
			const skill3 = { modifier: 30, strength: 5, level: 2 }
			const skill4 = { modifier: 40, strength: 5, level: 2 }

			await adapter.createGridArtifact({
				partyId: 'party-1',
				gridCharacterId: 'gc-1',
				artifactId: 'art-1',
				element: 1,
				level: 3,
				rerollSlot: 2,
				proficiency: 1,
				skill1,
				skill2,
				skill3,
				skill4
			})

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/party-1/grid_characters/gc-1/artifact',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						grid_artifact: {
							artifact_id: 'art-1',
							element: 1,
							level: 3,
							reroll_slot: 2,
							proficiency: 1,
							skill1,
							skill2,
							skill3,
							skill4
						}
					})
				})
			)
		})

		it('should unwrap gridArtifact from sync response', async () => {
			global.fetch = mockApiResponse(API.syncGridArtifact)

			const result = await adapter.syncGridArtifact('ga-1')

			expect(result).toEqual(EXPECTED.syncGridArtifact)
			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/grid_artifacts/ga-1/sync',
				expect.objectContaining({ method: 'POST' })
			)
		})
	})

	describe('batch operations', () => {
		it('should return empty array without fetching for empty batch create', async () => {
			global.fetch = vi.fn()

			const result = await adapter.createCollectionArtifactsBatch([])

			expect(result).toEqual({ artifacts: [] })
			expect(global.fetch).not.toHaveBeenCalled()
		})
	})
})
