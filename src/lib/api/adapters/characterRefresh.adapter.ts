/**
 * Character refresh adapter (contract C6, PR 5)
 *
 * Editors refresh a rebalanced character from the wiki with a preview before
 * anything is written:
 * - single character: `POST /characters/:id/reparse` with `preview: true`,
 *   then again with the returned `preview_token` to apply exactly what was shown;
 * - batch (the yearly rebalance): `/character_skill_refreshes`, run in a job
 *   and polled until it's previewed, then applied for the ticked characters.
 *
 * @module adapters/characterRefresh
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { Character } from './character.adapter'

export type RefreshChangeKind = 'created' | 'updated' | 'deleted'

export interface LocalizedName {
	en: string | null
	ja: string | null
}

export interface RefreshCounts {
	slotsCreated: number
	slotsDeleted: number
	versionsCreated: number
	versionsUpdated: number
	versionsDeleted: number
	effectsCreated: number
	effectsUpdated: number
	effectsDeleted: number
	linksCreated: number
	linksDeleted: number
}

export interface RefreshChange {
	/** Skill kind, e.g. `ability`, `support`, `charge_attack` */
	kind: string
	position: number
	ordinal: number
	name: LocalizedName
	change: RefreshChangeKind
	/** Column names (`description_en`, `cooldown`, …) plus `effects` and `links` */
	fields: string[]
}

export interface RefreshIconFallback {
	kind: string
	position: number
	ordinal: number
	name: LocalizedName
}

export interface CharacterRefreshResult {
	previewToken: string | null
	written: boolean
	wikiChanged: boolean
	/** null when the JP page wasn't fetched */
	wikiJpChanged: boolean | null
	fetchedAt: string | null
	counts: RefreshCounts
	changes: RefreshChange[]
	iconFallbacks: RefreshIconFallback[]
}

export interface CharacterReparseResponse {
	refresh: CharacterRefreshResult
	/** The full character when `refresh.written`, else null */
	character: Character | null
}

export type RefreshBatchStatus =
	'queued' | 'running' | 'previewed' | 'applying' | 'applied' | 'failed'

export type RefreshItemStatus =
	'queued' | 'fetching' | 'previewed' | 'applying' | 'applied' | 'skipped' | 'failed'

/** Why a batch item failed (D28); null when it didn't */
export type RefreshItemErrorCode =
	'wiki_fetch_failed' | 'build_refused' | 'unexpected' | 'preview_expired' | 'character_missing'

export interface RefreshBatchItem {
	characterId: string
	/** With styleSwap, builds the row's database link (D13) */
	granblueId: string
	styleSwap: boolean
	name: LocalizedName
	/** Set on a style row so it can be told apart from its base */
	styleName: LocalizedName | null
	status: RefreshItemStatus
	/** English detail from the API; shown under the localized line */
	error: string | null
	errorCode?: RefreshItemErrorCode | null
	/** The wiki's HTTP status for wiki_fetch_failed; null on a network error */
	errorStatus?: number | null
	refresh: CharacterRefreshResult | null
}

export interface RefreshBatch {
	id: string
	status: RefreshBatchStatus
	refetchJp: boolean
	createdAt: string
	items: RefreshBatchItem[]
}

/** Error codes the API puts in a 422 body's `error` (D11, D24) */
export type RefreshErrorCode = 'preview_expired' | 'too_many_characters' | 'invalid_characters'

const REFRESH_ERROR_CODES: readonly string[] = [
	'preview_expired',
	'too_many_characters',
	'invalid_characters'
]

/**
 * What went wrong with a refresh request, for the dialog to say so.
 * - unauthorized: 401, the session expired or isn't an editor's (ensure_editor_role);
 * - not_previewed: 409, a batch apply before the preview finished or after it was applied;
 * - other: anything else, including a 422 build refusal, whose `message` is shown.
 */
export type RefreshFailure =
	RefreshErrorCode | 'rate_limited' | 'unauthorized' | 'not_found' | 'not_previewed' | 'other'

/**
 * Classifies a rejected refresh request. Adapter errors arrive as plain
 * objects whose `details` may wrap the API body more than once, so the 422
 * `error` code is looked for down the chain.
 */
export function refreshFailure(error: unknown): RefreshFailure {
	const status = (error as { status?: unknown } | null)?.status
	if (status === 429) return 'rate_limited'
	// 403 isn't sent today (ensure_editor_role answers 401); treated the same.
	if (status === 401 || status === 403) return 'unauthorized'
	if (status === 404) return 'not_found'
	if (status === 409) return 'not_previewed'
	if (status === 422) {
		let node: unknown = error
		for (let depth = 0; node && typeof node === 'object' && depth < 5; depth++) {
			const code = (node as { error?: unknown }).error
			if (typeof code === 'string' && REFRESH_ERROR_CODES.includes(code)) {
				return code as RefreshErrorCode
			}
			node = (node as { details?: unknown }).details
		}
	}
	return 'other'
}

/** Most characters one batch refresh may hold (C6) */
export const MAX_BATCH_CHARACTERS = 20

/**
 * Requests here fetch from the wiki (≥2s per request server-side) or count
 * against a 5/hour limit, so a failure is never retried automatically.
 */
const NO_RETRY = { retries: 1 } as const

export class CharacterRefreshAdapter extends BaseAdapter {
	/** Fetches the current wikitext and builds in shadow mode. Writes nothing. */
	async preview(
		characterId: string,
		options: { refetchJp?: boolean } = {}
	): Promise<CharacterReparseResponse> {
		return this.request<CharacterReparseResponse>(`/characters/${characterId}/reparse`, {
			method: 'POST',
			body: {
				refetch: true,
				refetchJp: options.refetchJp ?? false,
				preview: true,
				previewToken: null
			},
			...NO_RETRY
		})
	}

	/** Writes exactly what the preview showed. An expired token is a 422 `preview_expired`. */
	async apply(characterId: string, previewToken: string): Promise<CharacterReparseResponse> {
		return this.request<CharacterReparseResponse>(`/characters/${characterId}/reparse`, {
			method: 'POST',
			body: { refetch: false, refetchJp: false, preview: false, previewToken },
			...NO_RETRY
		})
	}

	/** Rebuilds from the stored wikitext, without fetching. */
	async reparse(characterId: string): Promise<CharacterReparseResponse> {
		return this.request<CharacterReparseResponse>(`/characters/${characterId}/reparse`, {
			method: 'POST',
			body: { refetch: false, refetchJp: false, preview: false, previewToken: null },
			...NO_RETRY
		})
	}

	/** Starts a batch refresh (202). Character row ids, so a style row is picked on its own. */
	async createBatch(characterIds: string[], refetchJp = false): Promise<{ id: string }> {
		return this.request<{ id: string }>('/character_skill_refreshes', {
			method: 'POST',
			body: { characterIds, refetchJp },
			...NO_RETRY
		})
	}

	async getBatch(refreshId: string): Promise<RefreshBatch> {
		return this.request<RefreshBatch>(`/character_skill_refreshes/${refreshId}`, {
			method: 'GET'
		})
	}

	/** Applies the chosen characters (default: every previewed one) in a job (202). */
	async applyBatch(refreshId: string, characterIds?: string[]): Promise<void> {
		await this.request<unknown>(`/character_skill_refreshes/${refreshId}/apply`, {
			method: 'POST',
			body: characterIds ? { characterIds } : {},
			...NO_RETRY
		})
	}
}

export const characterRefreshAdapter = new CharacterRefreshAdapter(DEFAULT_ADAPTER_CONFIG)
