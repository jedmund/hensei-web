import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { UserRaidElementAdapter } from '../userRaidElement.adapter'
import { mockApiResponse } from './fixtures/helpers'

const apiRows = [
	{ raid_id: 'raid-1', raid_name: { en: 'Lucilius (Hard)', ja: 'ルシファーHL' }, elements: [1, 5] }
]

const rows = [
	{ raidId: 'raid-1', raidName: { en: 'Lucilius (Hard)', ja: 'ルシファーHL' }, elements: [1, 5] }
]

function calls() {
	return (global.fetch as ReturnType<typeof vi.fn>).mock.calls
}

describe('UserRaidElementAdapter', () => {
	let adapter: UserRaidElementAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new UserRaidElementAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
	})

	it('getMine reads the current user and camelCases the rows', async () => {
		global.fetch = mockApiResponse(apiRows)

		const result = await adapter.getMine()

		expect(calls()[0]![0]).toBe('https://api.example.com/user_raid_elements')
		expect(result).toEqual(rows)
	})

	it('getForUser encodes the username', async () => {
		global.fetch = mockApiResponse([])

		const result = await adapter.getForUser('a b')

		expect(calls()[0]![0]).toBe('https://api.example.com/users/a%20b/raid_elements')
		expect(result).toEqual([])
	})

	it('sync PUTs the raid and elements in snake_case', async () => {
		global.fetch = mockApiResponse(apiRows)

		const result = await adapter.sync('raid-1', [1, 5])

		const [url, init] = calls()[0]!
		expect(url).toBe('https://api.example.com/user_raid_elements/sync')
		expect(init.method).toBe('PUT')
		expect(JSON.parse(init.body)).toEqual({ raid_id: 'raid-1', elements: [1, 5] })
		expect(result).toEqual(rows)
	})
})
