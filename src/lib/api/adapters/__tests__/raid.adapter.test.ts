import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RaidAdapter } from '../raid.adapter'
import { API, EXPECTED } from './fixtures/raid.fixtures'
import { mockApiResponse } from './fixtures/helpers'

describe('RaidAdapter', () => {
	let adapter: RaidAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new RaidAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	describe('filter mapping', () => {
		it('should map all filters to query params', async () => {
			global.fetch = mockApiResponse([])

			await adapter.getAll({
				element: 1,
				groupId: 'grp-1',
				difficulty: 2,
				hl: true,
				extra: false,
				guidebooks: true
			})

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('element=1')
			expect(url).toContain('group_id=grp-1')
			expect(url).toContain('difficulty=2')
			expect(url).toContain('hl=true')
			expect(url).toContain('extra=false')
			expect(url).toContain('guidebooks=true')
		})

		it('should not attach query params when no filters', async () => {
			global.fetch = mockApiResponse([])

			await adapter.getAll()

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toBe('https://api.example.com/raids')
		})

		it('should only send specified filters', async () => {
			global.fetch = mockApiResponse([])

			await adapter.getAll({ element: 3, hl: true })

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('element=3')
			expect(url).toContain('hl=true')
			expect(url).not.toContain('group_id')
			expect(url).not.toContain('difficulty')
			expect(url).not.toContain('extra')
			expect(url).not.toContain('guidebooks')
		})
	})

	describe('download status', () => {
		it('should map all response fields correctly', async () => {
			global.fetch = mockApiResponse(API.downloadStatus)

			const result = await adapter.getRaidDownloadStatus('proto-bahamut')

			expect(result).toEqual(EXPECTED.downloadStatus)
		})
	})

	describe('image downloads', () => {
		it('should POST downloadRaidImage with size and force', async () => {
			global.fetch = mockApiResponse({ success: true })

			await adapter.downloadRaidImage('proto-bahamut', 'thumbnail', true)

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/raids/proto-bahamut/download_image',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ size: 'thumbnail', force: true })
				})
			)
		})

		it('should POST downloadRaidImages with options wrapper', async () => {
			global.fetch = mockApiResponse({ status: 'queued', raidId: 'raid-1', message: 'started' })

			await adapter.downloadRaidImages('proto-bahamut', { force: true, size: 'all' })

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/raids/proto-bahamut/download_images',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ options: { force: true, size: 'all' } })
				})
			)
		})
	})

	describe('cache clearing', () => {
		it('should clear both raid list and detail cache on update', async () => {
			global.fetch = mockApiResponse({ id: 'raid-1', slug: 'proto-bahamut' })
			const clearSpy = vi.spyOn(adapter as any, 'clearCache')

			await adapter.update('proto-bahamut', { name: { en: 'Updated' } } as any)

			expect(clearSpy).toHaveBeenCalledWith('/raids')
			expect(clearSpy).toHaveBeenCalledWith('/raids/proto-bahamut')
		})

		it('should clear both raid list and detail cache on delete', async () => {
			global.fetch = mockApiResponse({})
			const clearSpy = vi.spyOn(adapter as any, 'clearCache')

			await adapter.delete('proto-bahamut')

			expect(clearSpy).toHaveBeenCalledWith('/raids')
			expect(clearSpy).toHaveBeenCalledWith('/raids/proto-bahamut')
		})
	})
})
