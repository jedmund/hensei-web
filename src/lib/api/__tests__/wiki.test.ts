import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchWikiPage, fetchWikiPages, buildWikiDataMap } from '../wiki'

const mockFetch = vi.fn()

beforeEach(() => {
	vi.stubGlobal('fetch', mockFetch)
	mockFetch.mockReset()
})

function mockJsonResponse(data: any) {
	return { json: () => Promise.resolve(data) }
}

// ============================================================================
// fetchWikiPage
// ============================================================================

describe('fetchWikiPage', () => {
	it('returns wikitext on success', async () => {
		mockFetch.mockResolvedValue(
			mockJsonResponse({
				parse: { wikitext: { '*': '{{Some Template}}' } }
			})
		)

		const result = await fetchWikiPage('Zeta_(SSR)')
		expect(result.wikiPage).toBe('Zeta_(SSR)')
		expect(result.wikiRaw).toBe('{{Some Template}}')
		expect(result.error).toBeUndefined()
	})

	it('returns error from API', async () => {
		mockFetch.mockResolvedValue(
			mockJsonResponse({ error: { info: 'Page not found' } })
		)

		const result = await fetchWikiPage('NonExistent')
		expect(result.error).toBe('Page not found')
		expect(result.wikiRaw).toBeUndefined()
	})

	it('returns error when no wikitext in response', async () => {
		mockFetch.mockResolvedValue(
			mockJsonResponse({ parse: {} })
		)

		const result = await fetchWikiPage('EmptyPage')
		expect(result.error).toBe('No wikitext in response')
	})

	it('follows redirects', async () => {
		// First call returns redirect
		mockFetch
			.mockResolvedValueOnce(
				mockJsonResponse({
					parse: { wikitext: { '*': '#REDIRECT [[Actual Page]]' } }
				})
			)
			// Second call returns actual content
			.mockResolvedValueOnce(
				mockJsonResponse({
					parse: { wikitext: { '*': '{{Actual Content}}' } }
				})
			)

		const result = await fetchWikiPage('Redirect Page')
		expect(result.wikiPage).toBe('Actual Page')
		expect(result.wikiRaw).toBe('{{Actual Content}}')
		expect(result.redirectedFrom).toBe('Redirect Page')
	})

	it('handles fetch errors', async () => {
		mockFetch.mockRejectedValue(new Error('Network error'))

		const result = await fetchWikiPage('SomePage')
		expect(result.error).toBe('Network error')
	})

	it('handles non-Error throw', async () => {
		mockFetch.mockRejectedValue('string error')

		const result = await fetchWikiPage('SomePage')
		expect(result.error).toBe('string error')
	})
})

// ============================================================================
// fetchWikiPages
// ============================================================================

describe('fetchWikiPages', () => {
	it('fetches multiple pages in parallel', async () => {
		mockFetch.mockResolvedValue(
			mockJsonResponse({ parse: { wikitext: { '*': 'content' } } })
		)

		const results = await fetchWikiPages(['Page1', 'Page2'])
		expect(results).toHaveLength(2)
		expect(mockFetch).toHaveBeenCalledTimes(2)
	})
})

// ============================================================================
// buildWikiDataMap
// ============================================================================

describe('buildWikiDataMap', () => {
	it('builds map from successful results', () => {
		const results = [
			{ wikiPage: 'Page1', wikiRaw: 'content1' },
			{ wikiPage: 'Page2', wikiRaw: 'content2' },
			{ wikiPage: 'Page3', error: 'not found' }
		]

		const map = buildWikiDataMap(results)
		expect(map).toEqual({
			Page1: 'content1',
			Page2: 'content2'
		})
	})

	it('returns empty map for all errors', () => {
		const results = [{ wikiPage: 'Page1', error: 'not found' }]
		expect(buildWikiDataMap(results)).toEqual({})
	})

	it('returns empty map for empty input', () => {
		expect(buildWikiDataMap([])).toEqual({})
	})
})
