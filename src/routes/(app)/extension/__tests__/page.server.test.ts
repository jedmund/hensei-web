import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()

beforeEach(() => {
	vi.stubGlobal('fetch', mockFetch)
	mockFetch.mockReset()
})

async function callLoad() {
	const { load } = await import('../+page.server')
	const headers: Record<string, string> = {}
	const result = await load({
		setHeaders: (h: Record<string, string>) => Object.assign(headers, h)
	} as unknown as Parameters<typeof load>[0])
	return { result, headers }
}

describe('extension page server load', () => {
	it('returns parsed release from GitHub API', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve({
					tag_name: 'build-35',
					published_at: '2026-04-01T19:27:26Z'
				})
		})

		const { result, headers } = await callLoad()

		expect(result.release).toEqual({
			version: '35',
			publishedAt: '2026-04-01T19:27:26Z'
		})
		expect(headers['Cache-Control']).toContain('max-age=3600')
	})

	it('strips build- prefix from tag_name', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: () =>
				Promise.resolve({
					tag_name: 'build-123',
					published_at: '2026-01-01T00:00:00Z'
				})
		})

		const { result } = await callLoad()
		expect(result.release?.version).toBe('123')
	})

	it('returns null release on non-ok response', async () => {
		mockFetch.mockResolvedValue({ ok: false, status: 404 })

		const { result, headers } = await callLoad()

		expect(result.release).toBeNull()
		expect(headers['Cache-Control']).toBeUndefined()
	})

	it('returns null release on network failure', async () => {
		mockFetch.mockRejectedValue(new Error('Network error'))

		const { result } = await callLoad()

		expect(result.release).toBeNull()
	})
})
