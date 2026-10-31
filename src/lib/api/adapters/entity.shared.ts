/**
 * Shared types and response mappers for the weapon, character
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
 * Raw validation response shape, as typed by the validate endpoints
 */
export interface GranblueIdValidationResponse {
	valid: boolean
	granblue_id: string
	exists_in_db: boolean
	error?: string
	image_urls?: {
		main?: string
		grid?: string
		square?: string
	}
}

export function toValidationResult(
	response: GranblueIdValidationResponse
): GranblueIdValidationResult {
	return {
		valid: response.valid,
		granblueId: response.granblue_id,
		existsInDb: response.exists_in_db,
		error: response.error,
		imageUrls: response.image_urls
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
 * Raw download status response shape, as typed by the download_status endpoints.
 * Each entity adds its own id key (weapon_id, character_id, summon_id).
 */
export interface DownloadStatusResponse {
	status: string
	progress?: number
	images_downloaded?: number
	images_total?: number
	error?: string
	granblue_id?: string
	images?: Record<string, string[]>
	updated_at?: string
}

export function toDownloadStatus(response: DownloadStatusResponse): EntityDownloadStatus {
	return {
		status: response.status as EntityDownloadStatus['status'],
		progress: response.progress,
		imagesDownloaded: response.images_downloaded,
		imagesTotal: response.images_total,
		error: response.error,
		granblueId: response.granblue_id,
		images: response.images,
		updatedAt: response.updated_at
	}
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
