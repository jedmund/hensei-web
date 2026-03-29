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

		it('should wrap raw characters into collection objects when unowned=true', async () => {
			global.fetch = mockApiResponse(API.listCharactersUnowned)

			const result = await adapter.listCharacters('user-1', { unowned: 'true' })

			expect(result.results).toHaveLength(1)
			expect(result.results[0]).toMatchObject({
				id: 'c1',
				uncapLevel: 0,
				transcendenceStep: 0,
				perpetuity: false,
				ring1: null,
				ring2: null,
				ring3: null,
				ring4: null,
				earring: null,
				awakening: null,
				createdAt: '',
				updatedAt: ''
			})
		})

		it('should use entity id as collection object id when unowned=true', async () => {
			global.fetch = mockApiResponse(API.listCharactersUnowned)

			const result = await adapter.listCharacters('user-1', { unowned: 'true' })

			expect(result.results[0]?.id).toBe('c1')
		})

		it('should preserve raw character in nested field when unowned=true', async () => {
			global.fetch = mockApiResponse(API.listCharactersUnowned)

			const result = await adapter.listCharacters('user-1', { unowned: 'true' })

			expect(result.results[0]?.character).toEqual({ id: 'c1', nameEn: 'Katalina', element: 1 })
		})

		it('should not wrap items when unowned is not set', async () => {
			global.fetch = mockApiResponse(API.listCharacters)

			const result = await adapter.listCharacters('user-1', { unowned: undefined })

			expect(result.results).toEqual([{ id: 'cc-1', character: { id: 'c1' } }])
		})

		it('should pass unowned=true in the query string', async () => {
			global.fetch = mockApiResponse(API.listCharactersUnowned)

			await adapter.listCharacters('user-1', { unowned: 'true' })

			const calledUrl = vi.mocked(global.fetch).mock.calls[0]?.[0] as string
			expect(calledUrl).toContain('unowned=true')
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

		it('should wrap raw weapons into collection objects when unowned=true', async () => {
			global.fetch = mockApiResponse(API.listWeaponsUnowned)

			const result = await adapter.listWeapons('user-1', { unowned: 'true' })

			expect(result.results).toHaveLength(1)
			expect(result.results[0]).toMatchObject({
				id: 'w1',
				uncapLevel: 0,
				transcendenceStep: 0,
				awakening: null,
				createdAt: '',
				updatedAt: ''
			})
		})

		it('should use entity id as collection object id when unowned=true', async () => {
			global.fetch = mockApiResponse(API.listWeaponsUnowned)

			const result = await adapter.listWeapons('user-1', { unowned: 'true' })

			expect(result.results[0]?.id).toBe('w1')
		})

		it('should preserve raw weapon in nested field when unowned=true', async () => {
			global.fetch = mockApiResponse(API.listWeaponsUnowned)

			const result = await adapter.listWeapons('user-1', { unowned: 'true' })

			expect(result.results[0]?.weapon).toEqual({ id: 'w1', nameEn: 'Murgleis', element: 3 })
		})

		it('should not wrap items when unowned is not set', async () => {
			global.fetch = mockApiResponse(API.listWeapons)

			const result = await adapter.listWeapons('user-1', { unowned: undefined })

			expect(result.results).toEqual([{ id: 'cw-1' }])
		})

		it('should pass unowned=true in the query string', async () => {
			global.fetch = mockApiResponse(API.listWeaponsUnowned)

			await adapter.listWeapons('user-1', { unowned: 'true' })

			const calledUrl = vi.mocked(global.fetch).mock.calls[0]?.[0] as string
			expect(calledUrl).toContain('unowned=true')
		})

		it('should expand quantity in addWeapons', async () => {
			global.fetch = mockApiResponse({
				weapons: [{ id: 'cw-1' }, { id: 'cw-2' }, { id: 'cw-3' }],
				meta: { created: 3, errors: [] }
			})

			await adapter.addWeapons([{ weaponId: 'w1', quantity: 3 }])

			const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0]![1]!.body as string)
			// BaseAdapter transforms collectionWeapons → collection_weapons
			const items = body.collection_weapons
			expect(items).toHaveLength(3)
			items.forEach((item: Record<string, unknown>) => {
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
				{ weaponId: 'w1', quantity: 3 },
				{ weaponId: 'w2' } // quantity defaults to 1
			])

			const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0]![1]!.body as string)
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

		it('should wrap raw summons into collection objects when unowned=true', async () => {
			global.fetch = mockApiResponse(API.listSummonsUnowned)

			const result = await adapter.listSummons('user-1', { unowned: 'true' })

			expect(result.results).toHaveLength(1)
			expect(result.results[0]).toMatchObject({
				id: 's1',
				uncapLevel: 0,
				transcendenceStep: 0,
				createdAt: '',
				updatedAt: ''
			})
		})

		it('should use entity id as collection object id when unowned=true', async () => {
			global.fetch = mockApiResponse(API.listSummonsUnowned)

			const result = await adapter.listSummons('user-1', { unowned: 'true' })

			expect(result.results[0]?.id).toBe('s1')
		})

		it('should preserve raw summon in nested field when unowned=true', async () => {
			global.fetch = mockApiResponse(API.listSummonsUnowned)

			const result = await adapter.listSummons('user-1', { unowned: 'true' })

			expect(result.results[0]?.summon).toEqual({ id: 's1', nameEn: 'Bahamut', element: 0 })
		})

		it('should not wrap items when unowned is not set', async () => {
			global.fetch = mockApiResponse(API.listSummons)

			const result = await adapter.listSummons('user-1', { unowned: undefined })

			expect(result.results).toEqual([{ id: 'cs-1' }])
		})

		it('should pass unowned=true in the query string', async () => {
			global.fetch = mockApiResponse(API.listSummonsUnowned)

			await adapter.listSummons('user-1', { unowned: 'true' })

			const calledUrl = vi.mocked(global.fetch).mock.calls[0]?.[0] as string
			expect(calledUrl).toContain('unowned=true')
		})

		it('should expand quantity in addSummons', async () => {
			global.fetch = mockApiResponse({
				summons: [{ id: 'cs-1' }, { id: 'cs-2' }],
				meta: { created: 2, errors: [] }
			})

			await adapter.addSummons([{ summonId: 's1', quantity: 2 }])

			const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0]![1]!.body as string)
			const items = body.collection_summons
			expect(items).toHaveLength(2)
			items.forEach((item: Record<string, unknown>) => {
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
