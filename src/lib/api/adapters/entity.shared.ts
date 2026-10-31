/**
 * Shared types and helpers for the weapon, character
 * and summon adapters.
 *
 * @module adapters/entity.shared
 */

/**
 * Response from granblue_id validation (weapons, characters and summons)
 */
export interface GranblueIdValidationResult {
	valid: boolean
	granblueId: string
	existsInDb: boolean
	error?: string
	imageUrls?: {
		main?: string
		grid?: string
		square?: string
	}
}

/**
 * Fields shared by every entity's image download status
 */
export interface EntityDownloadStatus {
	status: 'queued' | 'processing' | 'completed' | 'failed' | 'not_found'
	progress?: number
	imagesDownloaded?: number
	imagesTotal?: number
	error?: string
	granblueId?: string
	images?: Record<string, string[]>
	updatedAt?: string
}

/**
 * Builds the request body for the batch_preview endpoints
 */
export function batchPreviewBody(
	wikiPages: string[],
	wikiData?: Record<string, string>
): { wiki_pages: string[]; wiki_data?: Record<string, string> } {
	const body: { wiki_pages: string[]; wiki_data?: Record<string, string> } = {
		wiki_pages: wikiPages
	}
	if (wikiData) {
		body.wiki_data = wikiData
	}
	return body
}

/**
 * Raw data response from /raw endpoint
 */
export interface EntityRawData {
	wikiRaw: string | null
	gameRawEn: Record<string, unknown> | null
	gameRawJp: Record<string, unknown> | null
}

/**
 * Result from batch_preview for a single wiki page
 */
export interface BatchPreviewResult<T> {
	wikiPage: string
	status: 'success' | 'error'
	granblueId?: string
	wikiRaw?: string
	parsedData?: T
	imageStatus?: 'pending' | 'exists' | 'error' | 'no_id'
	error?: string
	redirectedFrom?: string
}

/**
 * Response from batch_preview endpoint
 */
export interface BatchPreviewResponse<T> {
	results: BatchPreviewResult<T>[]
}
