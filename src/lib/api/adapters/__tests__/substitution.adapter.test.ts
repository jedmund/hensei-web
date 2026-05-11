import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SubstitutionAdapter } from '../substitution.adapter'
import { mockApiResponse } from './fixtures/helpers'

describe('SubstitutionAdapter', () => {
	let adapter: SubstitutionAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new SubstitutionAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	it('createSubstitution POSTs /substitutions with envelope', async () => {
		global.fetch = mockApiResponse({ id: 's1' })

		await adapter.createSubstitution({
			partyId: 'p1',
			gridType: 'GridWeapon',
			gridId: 'g1',
			itemId: 'i1',
			position: 0
		})

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/substitutions')
		expect(init.method).toBe('POST')
		expect(JSON.parse(init.body)).toEqual({
			substitution: {
				party_id: 'p1',
				grid_type: 'GridWeapon',
				grid_id: 'g1',
				item_id: 'i1',
				position: 0
			}
		})
	})

	it('updateSubstitution PUTs /substitutions/:id with partyId + position', async () => {
		global.fetch = mockApiResponse({ id: 's2' })

		await adapter.updateSubstitution('s2', { partyId: 'p1', position: 3 })

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/substitutions/s2')
		expect(init.method).toBe('PUT')
		expect(JSON.parse(init.body)).toEqual({
			substitution: { party_id: 'p1', position: 3 }
		})
	})

	it('deleteSubstitution DELETEs /substitutions/:id with partyId in body', async () => {
		global.fetch = mockApiResponse({})

		await adapter.deleteSubstitution('s3', 'p1')

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/substitutions/s3')
		expect(init.method).toBe('DELETE')
		expect(JSON.parse(init.body)).toEqual({ substitution: { party_id: 'p1' } })
	})

	it('forwards auth headers when provided', async () => {
		global.fetch = mockApiResponse({ id: 's1' })

		await adapter.createSubstitution(
			{ partyId: 'p1', gridType: 'GridWeapon', gridId: 'g1', itemId: 'i1' },
			{ Authorization: 'Bearer xyz' }
		)

		const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(init.headers).toMatchObject({ Authorization: 'Bearer xyz' })
	})
})
