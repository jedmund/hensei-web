import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CollectionAdapter } from '../collection.adapter'
import { API, EXPECTED } from './fixtures/collection.fixtures'
import { mockApiResponse } from './fixtures/helpers'

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
			global.fetch = mockApiResponse(API.listCharacters)

			const result = await adapter.listCharacters('user-1')

			expect(result).toEqual(EXPECTED.listCharacters)
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
			global.fetch = mockApiResponse(API.collectedCharactersSinglePage)

			const result = await adapter.getCollectedCharacterIds('user-1')

			expect(result).toEqual(EXPECTED.collectedCharacterIdsSinglePage)
			expect(global.fetch).toHaveBeenCalledTimes(1)
		})

		it('should fetch all pages for getCollectedCharacterIds', async () => {
			let callCount = 0
			global.fetch = vi.fn().mockImplementation(async () => {
				callCount++
				if (callCount === 1) {
					return {
						ok: true,
						json: async () => API.collectedCharactersPage1
					}
				}
				return {
					ok: true,
					json: async () => API.collectedCharactersPage2
				}
			})

			const result = await adapter.getCollectedCharacterIds('user-1')

			expect(result).toEqual(EXPECTED.collectedCharacterIdsMultiPage)
			expect(global.fetch).toHaveBeenCalledTimes(2)
		})
	})

	describe('weapons', () => {
		it('should handle weapons response key in listWeapons', async () => {
			global.fetch = mockApiResponse(API.listWeapons)

			const result = await adapter.listWeapons('user-1')

			expect(result.results).toEqual(EXPECTED.listWeapons.results)
		})

		it('should handle collectionWeapons response key in listWeapons', async () => {
			global.fetch = mockApiResponse(API.listWeaponsAlt)

			const result = await adapter.listWeapons('user-1')

			expect(result.results).toEqual(EXPECTED.listWeaponsAlt.results)
		})

		it('should expand quantity in addWeapons', async () => {
			global.fetch = mockApiResponse({
				weapons: [{ id: 'cw-1' }, { id: 'cw-2' }, { id: 'cw-3' }],
				meta: { created: 3, errors: [] }
			})

			await adapter.addWeapons([{ weaponId: 'w1', quantity: 3 } as any])

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
			global.fetch = mockApiResponse({
				weapons: [{ id: 'cw-1' }, { id: 'cw-2' }, { id: 'cw-3' }, { id: 'cw-4' }],
				meta: { created: 4, errors: [] }
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
			global.fetch = mockApiResponse(API.listSummons)

			const result = await adapter.listSummons('user-1')

			expect(result.results).toEqual(EXPECTED.listSummons.results)
		})

		it('should handle collectionSummons response key in listSummons', async () => {
			global.fetch = mockApiResponse(API.listSummonsAlt)

			const result = await adapter.listSummons('user-1')

			expect(result.results).toEqual(EXPECTED.listSummonsAlt.results)
		})

		it('should expand quantity in addSummons', async () => {
			global.fetch = mockApiResponse({
				summons: [{ id: 'cs-1' }, { id: 'cs-2' }],
				meta: { created: 2, errors: [] }
			})

			await adapter.addSummons([{ summonId: 's1', quantity: 2 } as any])

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
			global.fetch = mockApiResponse(API.listJobAccessories)

			const result = await adapter.listJobAccessories()

			expect(result).toEqual(EXPECTED.listJobAccessories)
		})
	})
})
