import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RaidAdapter } from '../raid.adapter'

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
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ([])
			})

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
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ([])
			})

			await adapter.getAll()

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toBe('https://api.example.com/raids')
		})

		it('should only send specified filters', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ([])
			})

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
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					status: 'completed',
					progress: 100,
					images_downloaded: 4,
					images_total: 4,
					raid_id: 'raid-1',
					slug: 'proto-bahamut',
					updated_at: '2024-01-01T00:00:00Z'
				})
			})

			const result = await adapter.getRaidDownloadStatus('proto-bahamut')

			expect(result.status).toBe('completed')
			expect(result.progress).toBe(100)
			expect(result.slug).toBe('proto-bahamut')
			expect(result.imagesDownloaded).toBe(4)
			expect(result.imagesTotal).toBe(4)
			expect(result.raidId).toBe('raid-1')
			expect(result.updatedAt).toBe('2024-01-01T00:00:00Z')
		})
	})

	describe('image downloads', () => {
		it('should POST downloadRaidImage with size and force', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ success: true })
			})

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
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ status: 'queued', raidId: 'raid-1', message: 'started' })
			})

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
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ id: 'raid-1', slug: 'proto-bahamut' })
			})
			const clearSpy = vi.spyOn(adapter as any, 'clearCache')

			await adapter.update('proto-bahamut', { name: { en: 'Updated' } } as any)

			expect(clearSpy).toHaveBeenCalledWith('/raids')
			expect(clearSpy).toHaveBeenCalledWith('/raids/proto-bahamut')
		})

		it('should clear both raid list and detail cache on delete', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({})
			})
			const clearSpy = vi.spyOn(adapter as any, 'clearCache')

			await adapter.delete('proto-bahamut')

			expect(clearSpy).toHaveBeenCalledWith('/raids')
			expect(clearSpy).toHaveBeenCalledWith('/raids/proto-bahamut')
		})
	})
})
