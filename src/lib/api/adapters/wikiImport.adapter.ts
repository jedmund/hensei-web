import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { WikiImportRequest, WikiImportResponse } from '$lib/types/api/wikiImport'

/**
 * Imports a team from gbf.wiki TeamSpread wikitext, parsed on the client by
 * `parseTeamSpread`. Like every adapter, the body goes out in snake_case
 * (`fullAutoOff` → `full_auto_off`) and the response comes back in camelCase.
 */
export class WikiImportAdapter extends BaseAdapter {
	/** Resolves the titles and reports what matched. Writes nothing. */
	async preview(request: WikiImportRequest): Promise<WikiImportResponse> {
		return this.request<WikiImportResponse>('/import/wiki', {
			method: 'POST',
			body: { wiki: { preview: true, ...request } }
		})
	}

	/**
	 * Creates the party. Not retried: a retry after a timeout could create the
	 * team twice.
	 */
	async create(request: WikiImportRequest): Promise<WikiImportResponse> {
		return this.request<WikiImportResponse>('/import/wiki', {
			method: 'POST',
			body: { wiki: { preview: false, ...request } },
			retries: 0
		})
	}
}

export const wikiImportAdapter = new WikiImportAdapter(DEFAULT_ADAPTER_CONFIG)
