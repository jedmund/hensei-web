import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { JobAdapter } from '../job.adapter'
import { API, EXPECTED } from './fixtures/job.fixtures'
import { mockApiResponse } from './fixtures/helpers'

describe('JobAdapter', () => {
	let adapter: JobAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new JobAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	describe('searchSkills', () => {
		it('should send full search params with jobId mapped to job', async () => {
			global.fetch = mockApiResponse(API.searchSkillsEmpty)

			await adapter.searchSkills({
				query: 'rage',
				jobId: 'job-1',
				page: 2,
				locale: 'ja',
				filters: { group: 1 }
			})

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/search/job_skills',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						search: {
							query: 'rage',
							job: 'job-1',
							page: 2,
							locale: 'ja',
							filters: { group: 1 }
						}
					})
				})
			)
		})

		it('should use defaults for optional params', async () => {
			global.fetch = mockApiResponse({ results: [], meta: {} })

			await adapter.searchSkills({ jobId: 'job-1' })

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/search/job_skills',
				expect.objectContaining({
					body: JSON.stringify({
						search: {
							query: '',
							job: 'job-1',
							page: 1,
							locale: 'en',
							filters: {}
						}
					})
				})
			)
		})

		it('should transform meta response fields correctly', async () => {
			global.fetch = mockApiResponse(API.searchSkills)

			const result = await adapter.searchSkills({ jobId: 'job-1' })

			expect(result.total).toBe(EXPECTED.searchSkills.total)
			expect(result.page).toBe(EXPECTED.searchSkills.page)
			expect(result.totalPages).toBe(EXPECTED.searchSkills.totalPages)
			expect(result.meta).toEqual(EXPECTED.searchSkills.meta)
		})

		it('should transform empty results with meta correctly', async () => {
			global.fetch = mockApiResponse(API.searchSkillsEmpty)

			const result = await adapter.searchSkills({ jobId: 'job-1' })

			expect(result.results).toEqual(EXPECTED.searchSkillsEmpty.results)
			expect(result.total).toBe(EXPECTED.searchSkillsEmpty.total)
			expect(result.totalPages).toBe(EXPECTED.searchSkillsEmpty.totalPages)
			expect(result.meta).toEqual(EXPECTED.searchSkillsEmpty.meta)
		})

		it('should fall back when meta is missing', async () => {
			global.fetch = mockApiResponse(API.searchSkillsNoMeta)

			const result = await adapter.searchSkills({ jobId: 'job-1' })

			expect(result.total).toBe(EXPECTED.searchSkillsNoMeta.total)
			expect(result.totalPages).toBe(EXPECTED.searchSkillsNoMeta.totalPages)
			expect(result.meta).toBe(EXPECTED.searchSkillsNoMeta.meta)
		})
	})

	describe('updatePartyJobSkills', () => {
		it('should map slots 0 and 2 to skill1_id and skill3_id', async () => {
			global.fetch = mockApiResponse({})

			await adapter.updatePartyJobSkills('party-1', [
				{ id: 'skill-a', slot: 0 },
				{ id: 'skill-b', slot: 2 }
			])

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/party-1/job_skills',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify({
						party: {
							skill1_id: 'skill-a',
							skill2_id: null,
							skill3_id: 'skill-b',
							skill4_id: null
						}
					})
				})
			)
		})

		it('should populate all 4 slots', async () => {
			global.fetch = mockApiResponse({})

			await adapter.updatePartyJobSkills('party-1', [
				{ id: 's1', slot: 0 },
				{ id: 's2', slot: 1 },
				{ id: 's3', slot: 2 },
				{ id: 's4', slot: 3 }
			])

			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: JSON.stringify({
						party: {
							skill1_id: 's1',
							skill2_id: 's2',
							skill3_id: 's3',
							skill4_id: 's4'
						}
					})
				})
			)
		})

		it('should set all slots to null when empty', async () => {
			global.fetch = mockApiResponse({})

			await adapter.updatePartyJobSkills('party-1', [])

			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: JSON.stringify({
						party: {
							skill1_id: null,
							skill2_id: null,
							skill3_id: null,
							skill4_id: null
						}
					})
				})
			)
		})
	})

	describe('removePartyJobSkill', () => {
		it('should DELETE with slot in body', async () => {
			global.fetch = mockApiResponse({})

			await adapter.removePartyJobSkill('party-1', 2)

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/parties/party-1/job_skills',
				expect.objectContaining({
					method: 'DELETE',
					body: JSON.stringify({ slot: 2 })
				})
			)
		})
	})

	describe('getAllAccessories', () => {
		it('should include accessory_type query param when provided', async () => {
			global.fetch = mockApiResponse([])

			await adapter.getAllAccessories(1)

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('/job_accessories?accessory_type=1')
		})

		it('should not include query param when type is omitted', async () => {
			global.fetch = mockApiResponse([])

			await adapter.getAllAccessories()

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toBe('https://api.example.com/job_accessories')
		})
	})

	describe('cache clearing', () => {
		it('should clear both job list and detail cache on updateJob', async () => {
			global.fetch = mockApiResponse({ id: 'job-1' })
			const clearSpy = vi.spyOn(adapter as any, 'clearCache')

			await adapter.updateJob('gbf-100', { name_en: 'Updated' })

			expect(clearSpy).toHaveBeenCalledWith('/jobs')
			expect(clearSpy).toHaveBeenCalledWith('/jobs/gbf-100')
		})

		it('should clear all job-related caches with clearJobCache', () => {
			const clearSpy = vi.spyOn(adapter as any, 'clearCache')

			adapter.clearJobCache()

			expect(clearSpy).toHaveBeenCalledWith('/jobs')
			expect(clearSpy).toHaveBeenCalledWith('/search/job_skills')
			expect(clearSpy).toHaveBeenCalledWith('/job_accessories')
		})
	})
})
