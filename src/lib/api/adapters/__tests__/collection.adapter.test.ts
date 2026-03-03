import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CollectionAdapter } from '../collection.adapter'

describe('CollectionAdapter', () => {
	let adapter: CollectionAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new CollectionAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	describe('characters', () => {
		it('should transform listCharacters response', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					characters: [{ id: 'cc-1', character: { id: 'c1' } }],
					meta: { count: 1, total_pages: 1, per_page: 20, current_page: 1 }
				})
			})

			const result = await adapter.listCharacters('user-1')

			expect(result.results).toEqual([{ id: 'cc-1', character: { id: 'c1' } }])
			expect(result.page).toBe(1)
			expect(result.total).toBe(1)
			expect(result.totalPages).toBe(1)
			expect(result.perPage).toBe(20)
		})

		it('should return empty without fetching for addCharacters with empty input', async () => {
			global.fetch = vi.fn()

			const result = await adapter.addCharacters([])

			expect(result).toEqual([])
			expect(global.fetch).not.toHaveBeenCalled()
		})

		it('should return { deleted: 0 } without fetching for removeCharactersBatch with empty ids', async () => {
			global.fetch = vi.fn()

			const result = await adapter.removeCharactersBatch([])

			expect(result).toEqual({ deleted: 0 })
			expect(global.fetch).not.toHaveBeenCalled()
		})

		it('should fetch single page for getCollectedCharacterIds', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					characters: [
						{ character: { id: 'c1' } },
						{ character: { id: 'c2' } }
					],
					meta: { count: 2, total_pages: 1, per_page: 100, current_page: 1 }
				})
			})

			const result = await adapter.getCollectedCharacterIds('user-1')

			expect(result).toEqual(['c1', 'c2'])
			expect(global.fetch).toHaveBeenCalledTimes(1)
		})

		it('should fetch all pages for getCollectedCharacterIds', async () => {
			let callCount = 0
			global.fetch = vi.fn().mockImplementation(async () => {
				callCount++
				if (callCount === 1) {
					return {
						ok: true,
						json: async () => ({
							characters: [{ character: { id: 'c1' } }, { character: { id: 'c2' } }],
							meta: { count: 4, total_pages: 2, per_page: 2, current_page: 1 }
						})
					}
				}
				return {
					ok: true,
					json: async () => ({
						characters: [{ character: { id: 'c3' } }, { character: { id: 'c4' } }],
						meta: { count: 4, total_pages: 2, per_page: 2, current_page: 2 }
					})
				}
			})

			const result = await adapter.getCollectedCharacterIds('user-1')

			expect(result).toEqual(['c1', 'c2', 'c3', 'c4'])
			expect(global.fetch).toHaveBeenCalledTimes(2)
		})
	})

	describe('weapons', () => {
		it('should handle weapons response key in listWeapons', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					weapons: [{ id: 'cw-1' }],
					meta: { count: 1, total_pages: 1, per_page: 20, current_page: 1 }
				})
			})

			const result = await adapter.listWeapons('user-1')

			expect(result.results).toEqual([{ id: 'cw-1' }])
		})

		it('should handle collectionWeapons response key in listWeapons', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					collection_weapons: [{ id: 'cw-2' }],
					meta: { count: 1, total_pages: 1, per_page: 20, current_page: 1 }
				})
			})

			const result = await adapter.listWeapons('user-1')

			expect(result.results).toEqual([{ id: 'cw-2' }])
		})

		it('should expand quantity in addWeapons', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					weapons: [{ id: 'cw-1' }, { id: 'cw-2' }, { id: 'cw-3' }],
					meta: { created: 3, errors: [] }
				})
			})

			await adapter.addWeapons([
				{ weaponId: 'w1', quantity: 3 } as any
			])

			const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
			// BaseAdapter transforms collectionWeapons → collection_weapons
			const items = body.collection_weapons
			expect(items).toHaveLength(3)
			items.forEach((item: any) => {
				expect(item.quantity).toBeUndefined()
				expect(item.weapon_id).toBe('w1')
			})
		})

		it('should handle mixed quantities in addWeapons', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					weapons: [{ id: 'cw-1' }, { id: 'cw-2' }, { id: 'cw-3' }, { id: 'cw-4' }],
					meta: { created: 4, errors: [] }
				})
			})

			await adapter.addWeapons([
				{ weaponId: 'w1', quantity: 3 } as any,
				{ weaponId: 'w2' } as any // quantity defaults to 1
			])

			const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
			const items = body.collection_weapons
			expect(items).toHaveLength(4)
		})

		it('should return empty without fetching for addWeapons with empty input', async () => {
			global.fetch = vi.fn()

			const result = await adapter.addWeapons([])

			expect(result).toEqual([])
			expect(global.fetch).not.toHaveBeenCalled()
		})

		it('should return { deleted: 0 } without fetching for removeWeaponsBatch with empty ids', async () => {
			global.fetch = vi.fn()

			const result = await adapter.removeWeaponsBatch([])

			expect(result).toEqual({ deleted: 0 })
			expect(global.fetch).not.toHaveBeenCalled()
		})
	})

	describe('summons', () => {
		it('should handle summons response key in listSummons', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					summons: [{ id: 'cs-1' }],
					meta: { count: 1, total_pages: 1, per_page: 20, current_page: 1 }
				})
			})

			const result = await adapter.listSummons('user-1')

			expect(result.results).toEqual([{ id: 'cs-1' }])
		})

		it('should handle collectionSummons response key in listSummons', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					collection_summons: [{ id: 'cs-2' }],
					meta: { count: 1, total_pages: 1, per_page: 20, current_page: 1 }
				})
			})

			const result = await adapter.listSummons('user-1')

			expect(result.results).toEqual([{ id: 'cs-2' }])
		})

		it('should expand quantity in addSummons', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					summons: [{ id: 'cs-1' }, { id: 'cs-2' }],
					meta: { created: 2, errors: [] }
				})
			})

			await adapter.addSummons([
				{ summonId: 's1', quantity: 2 } as any
			])

			const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
			const items = body.collection_summons
			expect(items).toHaveLength(2)
			items.forEach((item: any) => {
				expect(item.quantity).toBeUndefined()
			})
		})

		it('should return empty without fetching for addSummons with empty input', async () => {
			global.fetch = vi.fn()

			const result = await adapter.addSummons([])

			expect(result).toEqual([])
			expect(global.fetch).not.toHaveBeenCalled()
		})
	})

	describe('job accessories', () => {
		it('should unwrap jobAccessories from listJobAccessories response', async () => {
			const mockAccessories = [{ id: 'ja-1', name: 'Shield' }]
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ job_accessories: mockAccessories })
			})

			const result = await adapter.listJobAccessories()

			expect(result).toEqual(mockAccessories)
		})
	})
})
