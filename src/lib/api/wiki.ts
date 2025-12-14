/**
 * Wiki API Client
 *
 * Fetches wiki data directly from gbf.wiki in the browser.
 * This bypasses CloudFlare's server-side blocking by running in the client.
 */

const GBF_WIKI_API = 'https://gbf.wiki/api.php'

export interface WikiFetchResult {
	wikiPage: string
	wikiRaw?: string
	error?: string
	redirectedFrom?: string
}

/**
 * Fetches wiki text for a single page from gbf.wiki
 * Runs in browser to bypass CloudFlare
 */
export async function fetchWikiPage(pageName: string): Promise<WikiFetchResult> {
	const params = new URLSearchParams({
		action: 'parse',
		format: 'json',
		page: pageName,
		prop: 'wikitext',
		origin: '*' // Required for CORS
	})

	try {
		const response = await fetch(`${GBF_WIKI_API}?${params}`)
		const data = await response.json()

		if (data.error) {
			return { wikiPage: pageName, error: data.error.info }
		}

		const wikiText = data.parse?.wikitext?.['*']

		if (!wikiText) {
			return { wikiPage: pageName, error: 'No wikitext in response' }
		}

		// Handle redirects
		const redirectMatch = wikiText.match(/#REDIRECT \[\[(.*?)\]\]/)
		if (redirectMatch) {
			const redirectTarget = redirectMatch[1]
			const redirectResult = await fetchWikiPage(redirectTarget)
			return {
				...redirectResult,
				redirectedFrom: pageName,
				wikiPage: redirectResult.wikiPage
			}
		}

		return { wikiPage: pageName, wikiRaw: wikiText }
	} catch (e) {
		return { wikiPage: pageName, error: e instanceof Error ? e.message : String(e) }
	}
}

/**
 * Fetches wiki text for multiple pages in parallel
 */
export async function fetchWikiPages(pageNames: string[]): Promise<WikiFetchResult[]> {
	return Promise.all(pageNames.map(fetchWikiPage))
}

/**
 * Builds a wiki_data map from fetch results for sending to the API
 */
export function buildWikiDataMap(results: WikiFetchResult[]): Record<string, string> {
	const wikiData: Record<string, string> = {}
	for (const result of results) {
		if (result.wikiRaw) {
			wikiData[result.wikiPage] = result.wikiRaw
		}
	}
	return wikiData
}
