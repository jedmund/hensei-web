import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SubstitutionAdapter } from '../substitution.adapter'
import { PARAMS, REQUEST } from './fixtures/substitution.fixtures'
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

	it('createSubstitution POSTs /substitutions with the substitution envelope', async () => {
		global.fetch = mockApiResponse({ id: 's1' })

		await adapter.createSubstitution(PARAMS.create)

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/substitutions')
		expect(init.method).toBe('POST')
		expect(JSON.parse(init.body)).toEqual(REQUEST.create)
	})

	it('updateSubstitution PUTs /substitutions/:id with partyId + position', async () => {
		global.fetch = mockApiResponse({ id: 's2' })

		await adapter.updateSubstitution('s2', PARAMS.update)

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/substitutions/s2')
		expect(init.method).toBe('PUT')
		expect(JSON.parse(init.body)).toEqual(REQUEST.update)
	})

	it('deleteSubstitution DELETEs /substitutions/:id with partyId in body', async () => {
		global.fetch = mockApiResponse({})

		await adapter.deleteSubstitution('s3', 'p1')

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/substitutions/s3')
		expect(init.method).toBe('DELETE')
		expect(JSON.parse(init.body)).toEqual(REQUEST.destroy)
	})

	it('reorderSubstitutions POSTs /substitutions/reorder with the batch', async () => {
		global.fetch = mockApiResponse([])

		await adapter.reorderSubstitutions('p1', PARAMS.reorderEntries)

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/substitutions/reorder')
		expect(init.method).toBe('POST')
		expect(JSON.parse(init.body)).toEqual(REQUEST.reorder)
	})

	it('forwards auth headers when provided', async () => {
		global.fetch = mockApiResponse({ id: 's1' })

		await adapter.createSubstitution(PARAMS.create, { Authorization: 'Bearer xyz' })

		const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(init.headers).toMatchObject({ Authorization: 'Bearer xyz' })
	})
})
