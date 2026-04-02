import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { UserRaidElementAdapter } from '../userRaidElement.adapter'
import { mockApiResponse } from './fixtures/helpers'

/** API responses use snake_case keys */
const API_RESPONSE = [
	{
		raid_id: 'raid-1',
		raid_name: { en: 'Proto Bahamut', ja: 'プロトバハムート' },
		elements: [1, 3, 5]
	},
	{
		raid_id: 'raid-2',
		raid_name: { en: 'Akasha', ja: 'アーカーシャ' },
		elements: [2]
	}
]

/** After BaseAdapter transforms, keys become camelCase */
const TRANSFORMED_RESPONSE = [
	{
		raidId: 'raid-1',
		raidName: { en: 'Proto Bahamut', ja: 'プロトバハムート' },
		elements: [1, 3, 5]
	},
	{
		raidId: 'raid-2',
		raidName: { en: 'Akasha', ja: 'アーカーシャ' },
		elements: [2]
	}
]

describe('UserRaidElementAdapter', () => {
	let adapter: UserRaidElementAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new UserRaidElementAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	describe('getMyRaidElements', () => {
		it('should call GET /user_raid_elements and transform response', async () => {
			global.fetch = mockApiResponse(API_RESPONSE)

			const result = await adapter.getMyRaidElements()

			const url = vi.mocked(global.fetch).mock.calls[0]![0]
			expect(url).toBe('https://api.example.com/user_raid_elements')
			expect(result).toEqual(TRANSFORMED_RESPONSE)
		})

		it('should return an empty array when no elements exist', async () => {
			global.fetch = mockApiResponse([])

			const result = await adapter.getMyRaidElements()

			expect(result).toEqual([])
		})

		it('should forward authorization headers', async () => {
			global.fetch = mockApiResponse(API_RESPONSE)

			await adapter.getMyRaidElements({
				headers: { Authorization: 'Bearer test-token' }
			})

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/user_raid_elements',
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: 'Bearer test-token'
					})
				})
			)
		})
	})

	describe('syncRaidElements', () => {
		it('should call PUT /user_raid_elements/sync with raid_id and elements', async () => {
			global.fetch = mockApiResponse(API_RESPONSE)

			await adapter.syncRaidElements('raid-1', [1, 3, 5])

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/user_raid_elements/sync',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify({ raid_id: 'raid-1', elements: [1, 3, 5] })
				})
			)
		})

		it('should send an empty elements array to clear all elements', async () => {
			global.fetch = mockApiResponse([])

			await adapter.syncRaidElements('raid-1', [])

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/user_raid_elements/sync',
				expect.objectContaining({
					body: JSON.stringify({ raid_id: 'raid-1', elements: [] })
				})
			)
		})

		it('should return transformed response after syncing', async () => {
			const syncedApiResponse = [API_RESPONSE[0]]
			global.fetch = mockApiResponse(syncedApiResponse)

			const result = await adapter.syncRaidElements('raid-1', [1, 3, 5])

			expect(result).toEqual([TRANSFORMED_RESPONSE[0]])
		})
	})

	describe('getUserRaidElements', () => {
		it('should call GET /users/:username/raid_elements and transform response', async () => {
			global.fetch = mockApiResponse(API_RESPONSE)

			const result = await adapter.getUserRaidElements('testuser')

			const url = vi.mocked(global.fetch).mock.calls[0]![0]
			expect(url).toBe('https://api.example.com/users/testuser/raid_elements')
			expect(result).toEqual(TRANSFORMED_RESPONSE)
		})

		it('should url-encode special characters in username', async () => {
			global.fetch = mockApiResponse([])

			await adapter.getUserRaidElements('user name')

			const url = vi.mocked(global.fetch).mock.calls[0]![0]
			expect(url).toContain('user%20name')
		})

		it('should return an empty array for a user with no elements', async () => {
			global.fetch = mockApiResponse([])

			const result = await adapter.getUserRaidElements('newuser')

			expect(result).toEqual([])
			expect(result).toHaveLength(0)
		})
	})
})
